import sys
reload(sys)
sys.setdefaultencoding('utf-8')

import re
import json
import pandas as pd
from pymongo import MongoClient
from google.cloud import language
from gensim import corpora, models, similarities

global topic
topic = 128

class Train():
    def __init__(self):
        self.sentences = []
        self.words = []
    
    def load_data(self):
        db_client = MongoClient('localhost', 27017)
        db = db_client['Collections']
        storytable = db['stories']
        htmltable = db['html']
        data_list = []
        sentences = []
        
        count = 0
        for data in htmltable.find():
            tmp = []
            tmp.append(data['id'])
            story = storytable.find_one({'id':data['id']})
            if story.has_key('title') and story.has_key('url'):
                tmp.append(story['title'])
                tmp.append(story['url'])
                tmp.append(data['story_data:'])
                data_list.append(tmp)
        
        data = pd.DataFrame(data_list, columns=['id','title','url','content'])
        # data['idx'] = range(len(data.index))
        data.to_csv('./env/data.csv')
        
        for idx, row in data.iterrows():
            sentences.append(row['content'])
        
        return sentences
    
    def split_word(self):
        words = []
        client = language.Client()
        for text in self.sentences:
            try:
                try:
                    word = []
                    doc = client.document_from_text(text)
                    tokens = doc.analyze_syntax().tokens
                    for token in tokens:
                        if token.part_of_speech in ['VERB', 'NOUN']:
                            word.append(token.text_content)
                    words.append(word)
                except:
                    words.append(doc.lower().split())
            except:
                pass
        
        return words
    
    def build_dic(self):
        dic = corpora.Dictionary(self.words)
        dic.save('./env/dictionary')
        
        return dic
    
    def build_corpus(self, dic):
        # dic = corpora.Dictionary.load('./env/dictionary')
        corpus = [dic.doc2bow(text) for text in self.words]
        corpora.MmCorpus.serialize('./env/corpus', corpus)
        # corpus = corpora.MmCorpus('/env/corpus')
        
        return corpus
    
    def tfidf(self, corpus):
        tfidf = models.TfidfModel(corpus)
        tfidf.save('./env/model.tfidf')
        corpus_tfidf = tfidf[corpus]
        corpora.MmCorpus.serialize('./env/corpus.tfidf', corpus_tfidf)
        
        return corpus_tfidf
    
    def lsi(self, corpus_tfidf, dic):
        lsi = models.LsiModel(corpus_tfidf, id2word=dic, num_topics=topic)
        lsi.save('./env/model.lsi')
        corpus_lsi = lsi[corpus_tfidf]
        corpora.MmCorpus.serialize('./env/corpus.lsi', corpus_lsi)
    
    def lda(self, corpus_tfidf, dic):
        lda = models.LdaModel(corpus_tfidf, id2word=dic, num_topics=topic)
        lda.save('./env/model.lda')
        corpus_lda = lda[corpus_tfidf]
        corpora.MmCorpus.serialize('./env/corpus.lda', corpus_lda)
    
    def run(self):
        self.sentences = self.load_data()
        self.words = self.split_word()
        dictionary = self.build_dic()
        corpus = self.build_corpus(dictionary)
        corpus_tfidf = self.tfidf(corpus)
        self.lsi(corpus_tfidf, dictionary)
        self.lda(corpus_tfidf, dictionary)
        print 'Train Success!'

        
class Query():
    def __init__(self):
        pass
    
    def query(self, queries):
        dic = corpora.Dictionary.load('./env/dictionary')
        query_bow = dic.doc2bow(queries.lower().split())
        
        # tfidf
        sims_tfidf = self.tfidf(query_bow)
        result_tfidf = self.script(sims_tfidf)
        
        # # lda
        # sims_lda = self.lda(query_bow)
        # result_lda = self.script(sims_lda)
        
        # lsi
        sims_lsi = self.lsi(query_bow)
        result_lsi = self.script(sims_lsi)
        
        return result_lsi
    
    def tfidf(self, query_bow):
        tfidf = models.TfidfModel.load('./env/model.tfidf')
        corpus = corpora.MmCorpus('./env/corpus')
        index = similarities.MatrixSimilarity(tfidf[corpus])
        query_tfidf = tfidf[query_bow]
        sims = index[query_tfidf]
        sort_sims = sorted(enumerate(sims), key=lambda item: -item[1])
        
        return sort_sims
    
    def lda(self, query_bow):
        lda = models.LdaModel.load('./env/model.lda')
        corpus = corpora.MmCorpus('./env/corpus')
        index = similarities.MatrixSimilarity(lda[corpus])
        query_lda = lda[query_bow]
        sims = index[query_lda]
        sort_sims = sorted(enumerate(sims), key=lambda item: -item[1])
        
        return sort_sims

    def lsi(self, query_bow):
        lsi = models.LsiModel.load('./env/model.lsi')
        corpus = corpora.MmCorpus('./env/corpus')
        index = similarities.MatrixSimilarity(lsi[corpus])
        query_lsi = lsi[query_bow]
        sims = index[query_lsi]
        sort_sims = sorted(enumerate(sims), key=lambda item: -item[1])

        return sort_sims


    def script(self, sims):
        df = pd.read_csv('./env/data.csv')
        count = 0
        result = []
        for sim in sims:
            if count < 12:
                try:
                    tmp = []
                    idx = sim[0]
                    title = df[df['idx']==idx]['title']
                    url = df[df['idx']==idx]['url']
                    tmp.append(title)
                    tmp.append(url)
                    tmp = tuple(tmp)
                    result.append(tmp)
                    count += 1
                except:
                    pass
        
        return result