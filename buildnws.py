# Currently only works for Windows - there's a reason there's no shebang here

import subprocess
import argparse
import re
import os
import shutil
import json

def createDir(path):
	try: 
		os.makedirs(path)
	except OSError:
		if not os.path.isdir(path):
			raise

def deleteDir(path):
	try: 
		shutil.rmtree(path)
	except OSError:
		if os.path.isdir(path):
			raise

def removeFile(path):
	try:
		os.remove(path)
	except OSError:
		if os.path.isfile(path):
			raise
			
parser = argparse.ArgumentParser(description='Packages the Nose Wheel Steering plugin for GEFS.')
parser.add_argument('--version', help='Provide a specific version number to use.  Defaults to metadata value.')
arguments = parser.parse_args()
version = arguments.version

# stop calling the C drive - will break on OSX/Linux
# FIXME: highly dependent on user setup, should make locations customisable
node = 'C:/Web Server/nodejs/node.exe'
userhome = 'C:/Users/Karl Cheng/'
uglifyjs = userhome + 'node_modules/uglify-js/bin/uglifyjs'
dropbox = userhome + 'Desktop/Dropbox/'
base = userhome + 'GitHub/gefs-plugins/'
license = base + 'LICENSE.md'

# perhaps make this more configurable through arguments
root = base + 'nose_wheel_steering/'
setup = 'gefs_nws-setup'
folderShortName = 'nws'

# FIXME: I've been naughty and modified uglifyjs to add the --source-map-nopragma option: this will break if run somewhere else
minified = subprocess.check_output([node, uglifyjs, root + 'code.user.js', '-c', '-m eval=true', '--define DEBUG=false', '-b beautify=false,max-line-len=99999', '--source-map-nopragma', '--source-map-output'], shell=False).decode('utf-8').replace('\uFEFF', r'\uFEFF').replace('\\', r'\\').replace("'", r"\'").replace('\n', '').rstrip(';')
parts = minified.split('\x04')
# get metadata from greasemonkey directives
with open(root + 'code.user.js', encoding='utf-8') as file:
	c = [re.search(r'// @(\S+)(?:\s+(.*))?', re.sub(r'\s+$', '', meta)).groups() if meta else '' for meta in re.findall(r'.+', re.search(r'^// ==UserScript==([\s\S]*?)^// ==/UserScript==', file.read(), re.M | re.U).group(1))]

# only one content script supported currently
chromeManifest = {
	'manifest_version': 2,
	'content_scripts': [{
		'matches': [],
		'js': ['c.js']
	}]
}

for i in c:
	key = i[0]
	value = i[1]
	if key in chromeManifest:
		# make array in JSON if more than one value
		chromeManifest[key] = [chromeManifest[key], value]
	elif key == 'match':
		chromeManifest['content_scripts'][0]['matches'].append(value)
	elif key == 'run-at':
		chromeManifest['content_scripts'][0]['run-at'] = value
	elif key == 'namespace' or key == 'grant':
		# we might do something with these one day, you never know
		pass
	else:
		chromeManifest[key] = value

# custom exception for when version is invalid
InvalidVersionException = Exception('Invalid version in Greasemonkey metadata. Version must be in the format x.x.x.x, where x must be a positive integer less than 65536, without leading 0s')

# check if version was included as argument or not
notCustomVersion = False
if not version:
	try:
		version = chromeManifest['version']
		notCustomVersion = True
	except KeyError:
		raise Exception('Version missing from Greasemonkey metadata')
		
# increment build version if not explicitly specified as custom argument
list = version.split('.')
if 1 <= len(list) <= 4:
	for val in list:
		if not re.search(r'^(0|[1-9][0-9]{0,4})$', val) or int(val) > 65535:
			raise InvalidVersionException
	if notCustomVersion:
		list[3] = str(int(list[3]) + 1)
		chromeManifest['version'] = version = '.'.join(list)
	else:
		chromeManifest['version'] = '.'.join(list)
	extension = folderShortName + '_v' + '.'.join(list[:3])
else:
	raise InvalidVersionException

# we want our folder to be empty
pack = base + 'package/' + extension + '/'
deleteDir(pack)
createDir(pack)

# build the greasemonkey script
greasemonkey = dict(c)
greasemonkey['version'] = version
# don't you just *love* list comprehensions?
metadata = '\n'.join(['// @' + i.strip() + ' ' + greasemonkey[i] for i in greasemonkey])
userscript = pack + extension + '.user.js'
print('// ==UserScript==\n' + metadata + '\n// ==/UserScript==\n' + parts[1], end="", file=open(userscript, 'w', encoding='utf-8', newline='\r\n'))

# create the files needed to package the CRX file
path = pack + setup + '/'
createDir(path)
print("var d=document;top==window&&(d.getElementsByTagName('head')[0].appendChild(d.createElement('script')).text='" + parts[1] + "')", end='', file=open(path + 'c.js', 'w', encoding='utf-8', newline='\r\n'))
print(json.JSONEncoder(separators=(',',':')).encode(chromeManifest), end='', file=open(path + 'manifest.json', 'w', encoding='utf-8', newline='\r\n'))

# call Chrome and write extension to file
subprocess.check_call(['C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '--pack-extension=' + path, '--pack-extension-key=' + userhome + 'Desktop/' + setup + '.pem'], shell=False)

# delete the zip file if it already exists (we'll recreate it later)
zipfile = dropbox + 'gefs-plugins releases/' + extension + '.zip'
removeFile(zipfile)

# format README file with variables, then write to zip file
readme = pack + 'README.txt'
with open(root + 'README.txt') as file:
	print(file.read().format(version), end='', file=open(readme, 'w', encoding='utf-8', newline='\r\n'))

# zip the folder together for release
subprocess.call(['C:/Program Files/7-Zip/7z.exe', 'a', '-tzip', '-mx9', '-mm=Deflate', zipfile, readme, license, userscript, pack + setup + '.crx'], shell=False)