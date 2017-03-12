import pandas as pd
import pymongo
from pymongo import MongoClient
from bs4 import BeautifulSoup
import re
from nltk.corpus import stopwords

from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.externals import joblib

def text_dealer(text, remove_stopwords):
    raw_text = BeautifulSoup(text,'html').get_text()
    letters=re.sub('[^a-zA-Z]', '', raw_text)
    words = letters.lower().split()
    if remove_stopwords:
        stop_words = set(stopwords.words('english'))
        words=[w for w in words if w not in stop_words]
    return words

def predict_dealer(text):
    X_text = []
    X_text.append(' '.join(text_dealer(text, True)) )
    address = ["../interfaces/models/gs_count.m","../interfaces/models/gs_tfidf.m"]
    count_model = joblib.load(address[0])
    tfidf_model = joblib.load(address[1])
    
    return int(count_model.predict(X_text)[0][0]), int(tfidf_model.predict(X_text)[0][0])

text = "i am a stupid girl"
print predict_dealer(text)

    
