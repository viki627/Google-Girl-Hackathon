# -*- coding:utf-8 -*-
__author__ = 'qiyingzhang'

import pymongo
from pymongo import MongoClient
import urllib2
from bs4 import BeautifulSoup
import json
import re
from google.cloud import translate
import chardet

global translate_client
translate_client = translate.Client()
global target
target = 'en'

#get client
global db_client
db_client=MongoClient('localhost',27017);

#get database
global db
db = db_client["Collections"]

global stories_home
stories_home = "./../../shared/data/stories"
global storytable
storytable = db['stories']
global htmltable
htmltable = db['html']

def get_text(url, fileid):
    #output file name
    try:
        headers = {'User-Agent':'Mozilla/5.0 (X11; Linux x86_64; rv:49.0) Gecko/20100101 Firefox/49.0 '}
        req = urllib2.Request(url = url, headers= headers)
        content = urllib2.urlopen(req,timeout=20).read()
        soup = BeautifulSoup(content, "html.parser")
        df = ""
        for line in soup.find_all('p'):
            data = line.get_text().encode('utf-8')
            if data != "":
                translation = translate_client.translate(data, target_language=target)
                df+=translation['translatedText']
        if df != "":
            current_story = {"id":fileid,"story_data:":df}
            htmltable.insert(current_story)
    except:
        return;


print "start!!"
df = open(stories_home,'r')
cnt = 0
for line in df:
    get_json = json.loads(line)
    if "url" in get_json.keys():
        try:
            if get_json['url'] == "" or htmltable.find_one({'id':fileid}) != None:
                continue;
            get_url = get_json['url'].decode(chardet.detect(bytes(get_json['url']))['encoding']).encode("utf-8")
            get_id = get_json['id']
            print get_url,get_id
            if get_url != "" and "youtube" not in get_url and "pdf" not in get_url and "ppt" not in get_url:
                get_text(get_url,get_id)
        except:
            continue;
