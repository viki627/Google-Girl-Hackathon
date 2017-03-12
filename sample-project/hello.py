from flask import Flask, render_template,request,jsonify
app = Flask(__name__)

#@app.route('/')
#def hello_world():
 #   return 'Hello World!'

@app.route('/')
def index():
	return render_template('index_bk.html')

@app.route('/search', methods=['get', 'post'])
def Search():
	#if request.method == 'POST':
	search_text = request.args.get('keyword')
	print search_text
	#print search_text
	
	return jsonify({'data': 'ok'})

if __name__ == '__main__':
	app.run(debug=True,port = 5000)
