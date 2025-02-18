#
# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from predict import generate_midi
import os
from flask import send_file, request, session
import pretty_midi
import sys
if sys.version_info.major <= 2:
    from cStringIO import StringIO
else:
    from io import StringIO
import time
import json

from flask_socketio import SocketIO, emit


from flask import Flask
app = Flask(__name__, static_url_path='', static_folder=os.path.abspath('../static'))
app.secret_key = "secret"
socketio = SocketIO(app)

user_no = 1

# @app.before_request
# def before_request():
#     global user_no
#     if 'session' in session and 'user-id' in session:
#         pass
#     else:
#         session['session'] = os.urandom(24)
#         session['username'] = 'user'+str(user_no)
#         user_no += 1

@app.route('/predict', methods=['POST'])
def predict():
    now = time.time()
    values = json.loads(request.data)
    midi_data = pretty_midi.PrettyMIDI(StringIO(''.join(chr(v) for v in values)))
    duration = float(request.args.get('duration'))
    ret_midi = generate_midi(midi_data, duration)
    return send_file(ret_midi, attachment_filename='return.mid',
        mimetype='audio/midi', as_attachment=True)


@app.route('/', methods=['GET', 'POST'])
def index():
    return send_file('../static/index.html')

@socketio.on('connect', namespace='/visual')
def connect():
    print('connected!')

@socketio.on('start', namespace='/visual')
def connect(d):
    print('start', d);
    emit('started', d, broadcast=True)


@socketio.on('disconnect', namespace='/visual')
def disconnect():
    print "Disconnected"

@socketio.on('music_signal', namespace='/visual')
def receiveSignal(signal):
    print('music_signal', signal)
    emit('toss-signal', signal, broadcast=True)

if __name__ == '__main__':
#    socketio.run(app.run(host='127.0.0.1', port=8080))
    socketio.run(app, host='0.0.0.0')
