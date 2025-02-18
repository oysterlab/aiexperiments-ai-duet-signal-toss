/**
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Keyboard} from 'keyboard/Keyboard'
import {AI} from 'ai/AI'
import {Sound} from 'sound/Sound'
import {Glow} from 'interface/Glow'
import {Splash} from 'interface/Splash'
import {About} from 'interface/About'
import {Tutorial} from 'ai/Tutorial'
import 'babel-polyfill'

const socket = require('socket.io-client')(location.host + '/visual')
/////////////// SPLASH ///////////////////

const about = new About(document.body)
const splash = new Splash(document.body)
splash.on('click', () => {
	keyboard.activate()
	tutorial.start()
	about.showButton()
})
splash.on('about', () => {
	about.open(true)
})
about.on('close', () => {
	if (!splash.loaded || splash.isOpen()){
		splash.show()
	} else {
		keyboard.activate()
	}
})
about.on('open', () => {
	keyboard.deactivate()
	if (splash.isOpen()){
		splash.hide()
	}
})


/////////////// PIANO ///////////////////

/*
	{
		note: "" (48 ~ 95),
		type: "",
		from: "user or ai",
		time: ""
	}
*/

const container = document.createElement('div')
container.id = 'container'
document.body.appendChild(container)

const glow = new Glow(container)
const keyboard = new Keyboard(container)

const sound = new Sound()
sound.load()

const sendSignal = function(signal) {
	if(socket) {
		socket.emit('music_signal', signal)
	}
}

const startTime = (new Date()).getTime()
if(socket) {
	console.log('start', startTime)
	socket.emit('start', {startTime})
}

const now = function() {
	return ((new Date()).getTime() - startTime) / 1000.
}

keyboard.on('keyDown', (note) => {
	sound.keyDown(note)
	ai.keyDown(note)
	glow.user()
	sendSignal({
			note,
			type: 'keyDown',
			from: 'user',
			time: now()
		})
})

keyboard.on('keyUp', (note) => {
	sound.keyUp(note)
	ai.keyUp(note)
	glow.user()
	sendSignal({
			note,
			type: 'keyUp',
			from: 'user',
			time: now()
		})
})

/////////////// AI ///////////////////


const ai = new AI()

ai.on('keyDown', (note, time) => {
	sound.keyDown(note, time, true)
	keyboard.keyDown(note, time, true)
	glow.ai(time)
	sendSignal({
		note,
		type: 'keyDown',
		from: 'ai',
		time
	})
})

ai.on('keyUp', (note, time) => {
	sound.keyUp(note, time, true)
	keyboard.keyUp(note, time, true)
	glow.ai(time)
	sendSignal({
		note,
		type: 'keyUp',
		from: 'ai',
		time
	})
})

/////////////// TUTORIAL ///////////////////

const tutorial = new Tutorial(container)

tutorial.on('keyDown', (note, time) => {
	sound.keyDown(note, time)
	keyboard.keyDown(note, time)
	glow.user()
})

tutorial.on('keyUp', (note, time) => {
	sound.keyUp(note, time)
	keyboard.keyUp(note, time)
	glow.user()
})

tutorial.on('aiKeyDown', (note, time) => {
	ai.keyDown(note, time)
})

tutorial.on('aiKeyUp', (note, time) => {
	ai.keyUp(note, time)
})
