"""Analyze production contracts with the already-installed native compiler and Slither."""
import json
import posixpath
from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root.parent / 'services/analyzer'))
import worker

job = root / 'work/slither'
project = job / 'project'
project.mkdir(parents=True, exist_ok=True)
sources = {}
def collect(name):
    if name in sources: return
    physical = root / ('node_modules/' + name if name.startswith('@openzeppelin/') else name)
    source = physical.read_text(encoding='utf-8')
    sources[name] = {'content': source}
    dest = project / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(source, encoding='utf-8')
    for imported in re.findall(r'import\s+[^;]*?["\']([^"\']+)["\']\s*;', source):
        collect(posixpath.normpath(posixpath.join(posixpath.dirname(name), imported)) if imported.startswith('.') else imported)
for file in (root / 'src').glob('*.sol'): collect('src/' + file.name)
standard = {'language':'Solidity', 'sources':sources, 'settings':{'optimizer':{'enabled':True,'runs':200},'evmVersion':'cancun','outputSelection':{'*':{'':['ast'],'*':['abi','evm.bytecode','evm.deployedBytecode','metadata','devdoc','userdoc']}}}}
(job / 'input.json').write_text(json.dumps(standard))
with (job / 'input.json').open('rb') as stdin, (job / 'compiled.json').open('wb') as stdout, (job / 'compiler.stderr').open('wb') as stderr:
    subprocess.run([str(worker.SOLC),'--standard-json','--no-import-callback'],stdin=stdin,stdout=stdout,stderr=stderr,cwd=project,check=True)
compiled=json.loads((job/'compiled.json').read_text())
errors=[e['formattedMessage'] for e in compiled.get('errors',[]) if e['severity']=='error']
if errors: raise RuntimeError('\n'.join(errors))
worker.slither_result(job)
findings=json.loads((job/'slither.json').read_text())['detectors']
print(f'Slither: {len(findings)} total detector results (including OpenZeppelin dependencies).')
for item in findings:
    print(item['check'],item['impact'],item['confidence'])
    print(item['description'])
