from pprint import pprint
from parser import RepositoryParser

REPO_PATH = "/home/suzi/WORKSPACE/Open_source/Rhythma/"

parser = RepositoryParser(REPO_PATH)

result = parser.analyze()

pprint(result, sort_dicts=False)