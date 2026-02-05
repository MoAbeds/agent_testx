from flask import Flask, render_template, request
from mojo_agent import MojoGuardian

app = Flask(__name__)

# Initialize Mojo Guardian
mojo = MojoGuardian("mojo_0olio1pl57dg") # Using test API key
mojo.init()

@app.route('/')
@app.route('/<path:path>')
def index(path=''):
    seo = mojo.get_metadata("/" + path)
    
    title = seo.get('title') if seo else "Mojo Python Dummy"
    description = seo.get('metaDescription') if seo else "A Python/Flask test site for Mojo Guardian."
    
    return render_template('index.html', title=title, description=description)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
