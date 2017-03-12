# -*- coding:utf-8 -*-
__author__ = 'qiyingzhang'

import sys
reload(sys)
sys.setdefaultencoding('utf-8')
import pymongo
from pymongo import MongoClient
import json
import re
import pandas as pd

def comment_input_mongoe(address):
    #get client
    db_client=MongoClient('localhost',27017);
    
    #get database
    db = db_client["Collections"]
    
    commenttable = db['comment']
    
    input_file = open(address, 'r')
    for line in input_file:
        get_json = json.loads(line)
        commenttable.insert(get_json)
    input_file.close()

home = "../../shared/data/comments_"
for i in range(32):
    address = home + str(i).zfill(12)
    comment_input_mongoe(address)
