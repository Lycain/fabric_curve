import { canvas } from "./canvas.js";
import Line from "./Line.js";

/** @type {Line | null} */
let currentLine = null
// edit mode to prevent creating new lines when first one finished (dev purpose)
let edit = false

document.body.addEventListener('keydown', e => {
	// escape finish the curve and create handlers
	if (e.key === 'Escape') {
		currentLine?.Finish()
		currentLine = null
		edit = true
	}
})

document.querySelector('button').addEventListener('click', () => {
	Line.list.forEach(line => {
		line.ChangeType(
			line.type === 'curve' ? 'line' : 'curve'
		)
	})
})

canvas.on('mouse:down', ({ pointer }) => {
	if (edit) return

	// while clicking create new curves inside the current line
	if (!currentLine) currentLine = new Line(pointer)
	else currentLine.CreatePoint(pointer)
})

canvas.on('mouse:move', ({ pointer }) => currentLine?.Move(pointer))

// loop to update canvas and avoid manual call
function Render () {
	Line.list.forEach(line => line.Update())
	canvas.renderAll()
	requestAnimationFrame(Render)
}
Render()