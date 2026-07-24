import sys
import os
import json
sys.path.append(os.getcwd())

from core.parser import RepositoryParser

parser = RepositoryParser("/home/suzi/WORKSPACE/Projects/devforge-ai")
result = parser.analyze()

print(json.dumps(result, indent=2))
