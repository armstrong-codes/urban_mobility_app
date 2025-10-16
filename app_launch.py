from flask import Flask
from bridge import home, api


app = Flask(__name__)

app.register_blueprint(home, url_prefix='/')
app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=3000)