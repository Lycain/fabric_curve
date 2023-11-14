import { fabric } from "fabric";
import { canvas } from "./canvas.js";

export default class Line {
	/** @type {Array<Line>} */
	static list = []

	constructor (start, type = 'curve') {
		this.type = type
		this.debug = true

		/** @type {Array<{x : number, y : number, type : 'joint' | 'control'}>} */
		this.points = [{ ...start, type : 'joint' }]

		/** @type {Array<fabric.Circle>} */
		this.joints = []
		this.debugs = []

		/** @type {fabric.Path} */
		this.curve = new fabric.Path(`M ${this.points[0].x} ${this.points[0].y}`, {
			fill: '',
			stroke: 'black',
			selectable : false,
			evented : false
		});{}

		Line.list.push(this)
	}

	// add a new point to the line
	CreatePoint (pos) {
		this.points = this.points.filter(point => !point.temp)

		// create joint between last and current point
		if (this.points.length >= 2) {
			const last = this.points[this.points.length - 1]
			this.points.push({
				x : (pos.x - last.x) / 2 + last.x,
				y : (pos.y - last.y) / 2 + last.y,
				type : 'joint'
			})
		}

		this.points.push({ ...pos, type : 'control' })
	}

	// re generate the curve from the array of points
	UpdateCurve () {
		canvas.remove(this.curve)

		let path = ''
		for (let i = 0; i < this.points.length; i++) {
			// the first point start the path with M instruction
			if (i === 0) {
				path += `M ${this.points[0].x} ${this.points[0].y}`
				continue
			}

			// for the last point, just draw a line
			if (i === this.points.length - 1) {
				if (this.type === 'curve') {
					path += ` T ${this.points[i].x} ${this.points[i].y}`
				} else {
					path += ` L ${this.points[i].x} ${this.points[i].y}`
				}
				break
			}

			// every two point create a quadratic curve
			if (i % 2 !== 0 && i !== 0) {
				if (this.type === 'curve') {
					const q1 = this.points[i]
					const q2 = this.points[i + 1]
					path += ` Q ${q1.x} ${q1.y} ${q2.x} ${q2.y}`
				} else {
					path += ` L ${this.points[i].x} ${this.points[i].y}`
				}
			}
		}

		this.curve = new fabric.Path(path, {
			fill: '',
			stroke: 'black',
			selectable : false,
			evented : false
		});

		canvas.add(this.curve)
	}

	Update () {
		this.UpdateCurve()
		this.curve.setCoords()
		if (this.debug) this.Debug()
	}

	Move (pos) {
		if (this.points.length === 0) return
		this.points = this.points.filter(point => !point.temp)

		if (this.points.length >= 2) {
			const last = this.points[this.points.length - 1]
			this.points.push({
				x : (pos.x - last.x) / 2 + last.x,
				y : (pos.y - last.y) / 2 + last.y,
				type : 'joint',
				temp : true
			})
		}

		this.points.push({ ...pos, type : 'control', temp : true })
	}

	Finish () {
		this.points = this.points.filter(point => !point.temp)

		if (this.points.length <= 1) {
			this.Destroy()
			return
		}

		this.GenControls()
	}

	Destroy () {
		Line.list.splice(Line.list.indexOf(this), 1)
		this.ClearControls()
		canvas.remove(this.curve)
		canvas.remove(...this.debugs)
	}

	GenControls () {
		this.points.forEach((point, index) => {
			if (point.type === 'joint' && index !== 0) return

			const handle = new fabric.Circle({
				left : point.x,
				top : point.y,
				radius : 7,
				fill : 'red',
				selectable : true,
				originX : 'center',
				originY : 'center',
				hasControls : false
			})
			handle.bringToFront()
			this.joints.push(handle)
			canvas.add(handle)

			handle.on('moving', () => {
				const prevJoint = this.points[index - 1]
				const prevControl = this.points[index - 2]
				if (prevJoint && prevControl) {
					prevJoint.x = (handle.left - prevControl.x) / 2 + prevControl.x
					prevJoint.y = (handle.top - prevControl.y) / 2 + prevControl.y
				}

				const nextJoint = this.points[index + 1]
				const nextControl = this.points[index + 2]
				if (nextJoint && nextControl && index !== 0) {
					nextJoint.x = (nextControl.x - handle.left) / 2 + handle.left
					nextJoint.y = (nextControl.y - handle.top) / 2 + handle.top
				}

				point.x = handle.left
				point.y = handle.top
			})
		})
	}

	ClearControls () {
		canvas.remove(...this.joints)
		this.joints = []
	}

	Debug () {
		canvas.remove(...this.debugs)
		this.debugs = []

		this.points
		.filter(point => point.type === 'joint')
		.forEach((point, index) => {
			if (index === 0) return

			const item = new fabric.Circle({
				left : point.x,
				top : point.y,
				radius : 5,
				fill : '#0000ff55',
				selectable : false,
				originX : 'center',
				originY : 'center',
				hasControls : false,
				evented : false
			})
			item.sendToBack()

			canvas.add(item)
			this.debugs.push(item)
		})

		this.points
		.forEach((point, index) => {
			if (index === 0) return

			const prev = this.points[index - 1]

			const item = new fabric.Line([prev.x, prev.y, point.x, point.y], {
				stroke : '#0000ff70',
				strokeWidth : .5,
				selectable : false,
				originX : 'center',
				originY : 'center',
				hasControls : false,
				evented : false
			})
			item.sendToBack()

			canvas.add(item)
			this.debugs.push(item)
		})
	}

	ChangeType (type) {
		this.type = type
		this.UpdateCurve()
	}
}