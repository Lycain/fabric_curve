import { fabric } from "fabric";
import { canvas } from "./canvas.js";

export default class Line {
	constructor (start) {
		/** @type {{x : number, y : number, type : 'joint' | 'control'}} */
		this.points = [{ ...start, type : 'joint' }]

		/** @type {Array<fabric.Circle>} */
		this.joints = []

		/** @type {fabric.Path} */
		this.curve = new fabric.Path(`M ${this.points[0].x} ${this.points[0].y}`, {
			fill: '',
			stroke: 'black'
		});
	}

	// add a new point to the line
	CreatePoint (pos) {
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
		this.UpdateCurve()
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
				path += ` T ${this.points[i].x} ${this.points[i].y}`
				break
			}

			// every two point create a quadratic curve
			if (i % 2 !== 0 && i !== 0) {
				const q1 = this.points[i]
				const q2 = this.points[i + 1]
				path += ` Q ${q1.x} ${q1.y} ${q2.x} ${q2.y}`
			}
		}

		this.curve = new fabric.Path(path, {
			fill: '',
			stroke: 'black'
		});

		canvas.add(this.curve)
		this.Update()
	}

	Update () {
		this.curve.setCoords()
	}

	Finish () {
		this.GenControls()
		this.Update()
	}

	GenControls () {
		this.points.forEach(point=> {
			const handle = this.CreateHandle(point.x, point.y, point.type)
			this.joints.push(handle)
			canvas.add(handle)

			handle.on('moving', () => {
				// for now just update the point position and redraw the curve
				// could be optimized by directly updating the curve's path data
				// as this.curve.path give a 2D array of points composing the path
				point.x = handle.left
				point.y = handle.top
				this.UpdateCurve()
			})
		})
	}

	ClearControls () {
		canvas.remove(...this.joints)
		this.joints = []
	}

	CreateHandle (left, top, type) {
		// red handles are control points
		// blue handles are joint points
		return new fabric.Circle({
			left,
			top,
			radius: 5,
			fill: type === 'joint' ? 'blue' : 'red',
			selectable: true,
			originX: 'center',
			originY: 'center',
			hasControls: false
		})
	}
}