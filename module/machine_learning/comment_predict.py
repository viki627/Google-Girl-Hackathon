import pandas as pd
import pymongo
from pymongo import MongoClient

db_client=MongoClient('localhost',27017);
db = db_client["Collections"]
table = db['comment']

data_list = []
cnt = 0
for line in table.find():
    if line.has_key("id") and line.has_key("text") and line.has_key("ranking"):
        data_list.append([line["id"], line["text"], line["ranking"]])
        cnt+=1
    if cnt == 100000:
        break;
df = pd.DataFrame(data_list, columns=["id", "text", "ranking"])

print len(df.index)
print "finish df deal"

from bs4 import BeautifulSoup
import re
from nltk.corpus import stopwords

def text_dealer(text, remove_stopwords):
    raw_text = BeautifulSoup(text,'html').get_text()
    letters=re.sub('[^a-zA-Z]', '', raw_text)
    words = letters.lower().split()
    if remove_stopwords:
        stop_words = set(stopwords.words('english'))
        words=[w for w in words if w not in stop_words]
    return words

X_train = []
for text in df["text"]:
    X_train.append(' '.join(text_dealer(text, True)));
Y_train = df["ranking"].ravel()

print X_train
print Y_train
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.grid_search import GridSearchCV
from sklearn.naive_bayes import MultinomialNB
from sklearn.externals import joblib

pip_count = Pipeline([('count_vec', CountVectorizer(analyzer='word')), ('mnb', MultinomialNB())])
pip_tfidf = Pipeline([('tfidf_vec', TfidfVectorizer(analyzer='word')), ('mnb', MultinomialNB())])

#params_count={'count_vec_binary':[True, False], 'count_vec_ngram_range':[(1,1),(2,2)]}
#params_tfidf={'tfidf_vec_binary':[True, False], 'tfidf_vec_ngram_range':[(1,1),(2,2)]}

#gs_count = GridSearchCV(pip_count, params_count, cv = 4, n_jobs=-1,verbose=1)
pip_count.fit(X_train, Y_train)
joblib.dump(pip_count, "gs_count.m")

#gs_tfidf = GridSearchCV(pip_tfidf, params_tfidf, cv = 4, n_jobs=-1,verbose=1)
pip_tfidf.fit(X_train, Y_train)
joblib.dump(pip_tfidf,"gs_tfidf.m")
