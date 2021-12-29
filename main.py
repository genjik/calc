from bottle import get, post, run, static_file, request
from subprocess import Popen, PIPE
import json

@get('/')
def index():
    return static_file('index.html', root='./static')

@get("/static/<filepath:re:.*\.(css|js)>")
def serve_static(filepath):
    return static_file(filepath, root="./static")

@post("/api/calc")
def calc():
    payload = request.body.read().decode()
    val = json.loads(payload)

    process = Popen(["qalc", val["payload"]], stdout=PIPE)
    (output, err) = process.communicate()
    exit_code = process.wait()

    return json.dumps(str(output.decode("utf-8")))

run(host='localhost', port=8080, debug=True)
