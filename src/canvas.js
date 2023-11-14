import { fabric } from "fabric";

// override default origin to center
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

// create fabric's canvas
const canvas = new fabric.Canvas('canvas', {
	stateful : true,
	renderOnAddRemove : false,
	targetFindTolerance : 8,
	perPixelTargetFind : true,
	preserveObjectStacking : true
})

export { canvas }