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

def get_html_dataframe():
    #get client
    db_client=MongoClient('localhost',27017);
    
    #get database
    db = db_client["Collections"]
    
    storytable = db['stories']
    htmltable = db['html']
    data_list = []
    
    cnt = 0
    for data in htmltable.find():
        cur_list = []
        cur_list.append(data["id"])
        story = storytable.find_one({"id":data["id"]})
        if story.has_key("title") and story.has_key("url"):
            cur_list.append(story["title"])
            cur_list.append(story["url"])
            cur_list.append(data["story_data:"])
            data_list.append(cur_list)
    data = pd.DataFrame(data_list,columns=["id", "title", "url","content"]);
    data["idx"] = range(len(data.index))
    return data

