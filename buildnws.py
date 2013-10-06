import subprocess
import argparse
import re
import os
import shutil
import json
parser = argparse.ArgumentParser(description='Packages the Nose Wheel Steering plugin for GEFS.')
parser.add_argument('--version', help='Provide a specific version number to use.  Defaults to metadata value.')
version = parser.parse_args().version
node = 'C:/Web Server/nodejs/node.exe'
uglifyjs = 'C:/Users/Karl Cheng/node_modules/uglify-js/bin/uglifyjs'
base = 'C:/Users/Karl Cheng/Desktop/Dropbox/GitHub/gefs-plugins/'
root = base + 'nose_wheel_steering/'
setup = 'gefs_nws-setup'
folderShortName = 'nws'
file = subprocess.check_output([node, uglifyjs, root + 'code.user.js', '--source-map-output=true', '--source-map-inline=false', '-c', '-m sort=true,eval=true', '-b beautify=false,max-line-len=99999'], shell=False).decode('utf-8').replace('\uFEFF', r'\uFEFF').replace('\\', r'\\').replace("'", r"\'").replace('\n', '').rstrip(';')
parts = file.split('\u0004')
a = file.split('\u0004')[1]
with open(root + 'code.user.js', encoding='utf-8') as file:
	c = [re.search(r'// @(\S+)(?:\s+(.*))?', re.sub(r'\s+$', '', meta)).groups() if meta else '' for meta in re.findall(r'.+', re.search(r'^// ==UserScript==([\s\S]*?)^// ==/UserScript==', file.read(), re.M | re.U).group(1))]
d = {
	'manifest_version': 2,
	'content_scripts': [{
		'matches': [],
		'js': ['l.js']
	}] # ,
	# 'web_accessible_resources': ['c.map']
}
for key in c:
	if key[0] in d:
		d[key[0]] = [d[key[0]], key[1]]
	elif key[0] == 'match':
		d['content_scripts'][0]['matches'].append(key[1])
	elif key[0] == 'run-at':
		d['content_scripts'][0]['run-at'] = key[1]
	elif key[0] != 'namespace' and key[0] != 'grant':
		d[key[0]] = key[1]

notCustomVersion = False
if not version:
	if 'version' in d and isinstance(d['version'], str):
		version = d['version']
		notCustomVersion = True
	else:
		raise Exception('Version missing from Greasemonkey metadata')
list = version.split('.')
if 1 <= len(list) <= 4:
	for val in list:
		if not re.search(r'^[0-9]{1,5}$', val) or val.startswith('0') and val != '0' or int(val) > 65535:
			raise Exception('Invalid version in Greasemonkey metadata. Version must be in the format x.x.x.x, where x must be a positive integer less than 65536, without leading 0s')
	if notCustomVersion:
		list[3] = str(int(list[3]) + 1)
	extension = folderShortName + '_v' + '.'.join(list[:3])
	d['version'] = '.'.join(list)
else:
	raise Exception('Invalid version in Greasemonkey metadata')

build = base + 'package/'
pack = build + extension + '/'
try: 
    shutil.rmtree(pack)
except OSError:
    if os.path.isdir(pack):
        raise
try: 
    os.makedirs(pack)
except OSError:
    if not os.path.isdir(pack):
        raise

path = pack + setup + '/'
try: 
    shutil.rmtree(path)
except OSError:
    if os.path.isdir(path):
        raise
try: 
    os.makedirs(path)
except OSError:
    if not os.path.isdir(path):
        raise

print("var d=document,h=d.getElementsByTagName('head')[0],s=d.createElement('script');s.onload=function(){this.parentNode.removeChild(this)};s.textContent='"+parts[1]+"';top==window?h.appendChild(s):delete s", end="", file=open(path +'l.js', 'w', encoding='utf-8'))
# print("var d=document,h=d.getElementsByTagName('head')[0],s=d.createElement('script');s.onload=function(){this.parentNode.removeChild(this)};s.textContent='//# sourceMappingURL='+chrome.extension.getURL('c.map')+'\\n"+parts[1]+"';top==window?h.appendChild(s):delete s", end="", file=open(path +'l.js', 'w', encoding='utf-8'))
# print(parts[0], end="", file=open(path +'c.map', 'w', encoding='utf-8'))
print(json.JSONEncoder(separators=(',',':')).encode(d), end="", file=open(path +'manifest.json', 'w', encoding='utf-8'))

subprocess.check_call(['C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '--pack-extension=' + path, '--pack-extension-key=C:/Users/Karl Cheng/Desktop/' + setup + '.pem'], shell=False)

zipfile = build + extension + '.zip'
try:
	os.remove(zipfile)
except OSError:
    if os.path.isfile(zipfile):
        raise

with open(root + 'README.txt') as file:
	print(file.read().format(version), end="", file=open(pack +'README.txt', 'w', encoding='utf-8'))
		
subprocess.call(['C:/Program Files/7-Zip/7z.exe', 'a', '-tzip', '-mx9', '-mm=Deflate', zipfile, pack + 'README.txt', pack + setup + '.crx'], shell=False)
os.system('pause')