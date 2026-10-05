import { Helper } from "../Helper.js";
import type { Point, Rect, RectPoints, Segment } from "../BasicTypes.js";
import { FlipCorner, FlipDirection } from "./Flip.js";

/**
 * Class representing mathematical methods for calculating page position (rotation angle, clip area ...)
 */
export class FlipCalculation {
	private angle = 0;
	private position: Point = { x: 0, y: 0 };
	private rect: RectPoints = {
		topLeft: { x: 0, y: 0 },
		topRight: { x: 0, y: 0 },
		bottomLeft: { x: 0, y: 0 },
		bottomRight: { x: 0, y: 0 },
	};

	private topIntersectPoint: Point | null = null;
	private sideIntersectPoint: Point | null = null;
	private bottomIntersectPoint: Point | null = null;

	private readonly pageWidth: number;
	private readonly pageHeight: number;

	constructor(
		private readonly direction: FlipDirection,
		private readonly corner: FlipCorner,
		pageWidth: string,
		pageHeight: string,
	) {
		this.pageWidth = parseInt(pageWidth, 10);
		this.pageHeight = parseInt(pageHeight, 10);
	}

	public calc(localPos: Point): boolean {
		try {
			this.position = this.calcAngleAndPosition(localPos);
			this.calculateIntersectPoint(this.position);

			return true;
		} catch {
			return false;
		}
	}

	public getFlippingClipArea(): Point[] {
		const result: Point[] = [];
		let clipBottom = false;

		result.push(this.rect.topLeft);

		if (this.topIntersectPoint) result.push(this.topIntersectPoint);

		if (this.sideIntersectPoint === null) {
			clipBottom = true;
		} else {
			result.push(this.sideIntersectPoint);

			if (this.bottomIntersectPoint === null) clipBottom = false;
		}

		if (this.bottomIntersectPoint) result.push(this.bottomIntersectPoint);

		if (clipBottom || this.corner === FlipCorner.BOTTOM) {
			result.push(this.rect.bottomLeft);
		}

		return result;
	}

	public getBottomClipArea(): Point[] {
		const result: Point[] = [];

		if (this.topIntersectPoint) result.push(this.topIntersectPoint);

		if (this.corner === FlipCorner.TOP) {
			result.push({ x: this.pageWidth, y: 0 });
		} else {
			if (this.topIntersectPoint !== null) {
				result.push({ x: this.pageWidth, y: 0 });
			}

			result.push({ x: this.pageWidth, y: this.pageHeight });
		}

		if (this.sideIntersectPoint !== null) {
			if (
				!this.topIntersectPoint ||
				Helper.GetDistanceBetweenTwoPoint(
					this.sideIntersectPoint,
					this.topIntersectPoint,
				) >= 10
			) {
				result.push(this.sideIntersectPoint);
			}
		} else {
			if (this.corner === FlipCorner.TOP) {
				result.push({ x: this.pageWidth, y: this.pageHeight });
			}
		}

		if (this.bottomIntersectPoint) result.push(this.bottomIntersectPoint);

		if (this.topIntersectPoint) result.push(this.topIntersectPoint);

		return result;
	}

	public getAngle(): number {
		if (this.direction === FlipDirection.FORWARD) {
			return -this.angle;
		}

		return this.angle;
	}

	public getRect(): RectPoints {
		return this.rect;
	}

	public getPosition(): Point {
		return this.position;
	}

	public getActiveCorner(): Point {
		if (this.direction === FlipDirection.FORWARD) {
			return this.rect.topLeft;
		}

		return this.rect.topRight;
	}

	public getDirection(): FlipDirection {
		return this.direction;
	}

	public getFlippingProgress(): number {
		return Math.abs(
			((this.position.x - this.pageWidth) / (2 * Math.max(1, this.pageWidth))) * 100,
		);
	}

	public getCorner(): FlipCorner {
		return this.corner;
	}

	public getBottomPagePosition(): Point {
		if (this.direction === FlipDirection.BACK) {
			return { x: this.pageWidth, y: 0 };
		}

		return { x: 0, y: 0 };
	}

	public getShadowStartPoint(): Point {
		if (this.corner === FlipCorner.TOP) {
			return this.topIntersectPoint ?? { x: 0, y: 0 };
		}

		if (this.sideIntersectPoint !== null) return this.sideIntersectPoint;

		return this.topIntersectPoint ?? { x: 0, y: 0 };
	}

	public getShadowAngle(): number {
		const angle = Helper.GetAngleBetweenTwoLine(this.getSegmentToShadowLine(), [
			{ x: 0, y: 0 },
			{ x: this.pageWidth, y: 0 },
		]);

		if (this.direction === FlipDirection.FORWARD) {
			return angle;
		}

		return Math.PI - angle;
	}

	private calcAngleAndPosition(pos: Point): Point {
		let result = pos;

		this.updateAngleAndGeometry(result);

		if (this.corner === FlipCorner.TOP) {
			result = this.checkPositionAtCenterLine(
				result,
				{ x: 0, y: 0 },
				{ x: 0, y: this.pageHeight },
			);
		} else {
			result = this.checkPositionAtCenterLine(
				result,
				{ x: 0, y: this.pageHeight },
				{ x: 0, y: 0 },
			);
		}

		if (Math.abs(result.x - this.pageWidth) < 1 && Math.abs(result.y) < 1) {
			throw new Error("Point is too small");
		}

		return result;
	}

	private updateAngleAndGeometry(pos: Point): void {
		this.angle = this.calculateAngle(pos);
		this.rect = this.getPageRect(pos);
	}

	private calculateAngle(pos: Point): number {
		const left = this.pageWidth - pos.x + 1;
		const top = this.corner === FlipCorner.BOTTOM ? this.pageHeight - pos.y : pos.y;

		let angle = 2 * Math.acos(left / Math.sqrt(top * top + left * left));

		if (top < 0) angle = -angle;

		const da = Math.PI - angle;

		if (!isFinite(angle) || (da >= 0 && da < 0.003)) {
			throw new Error("The G point is too small");
		}

		if (this.corner === FlipCorner.BOTTOM) angle = -angle;

		return angle;
	}

	private getPageRect(localPos: Point): RectPoints {
		if (this.corner === FlipCorner.TOP) {
			return this.getRectFromBasePoint(
				[
					{ x: 0, y: 0 },
					{ x: this.pageWidth, y: 0 },
					{ x: 0, y: this.pageHeight },
					{ x: this.pageWidth, y: this.pageHeight },
				],
				localPos,
			);
		}

		return this.getRectFromBasePoint(
			[
				{ x: 0, y: -this.pageHeight },
				{ x: this.pageWidth, y: -this.pageHeight },
				{ x: 0, y: 0 },
				{ x: this.pageWidth, y: 0 },
			],
			localPos,
		);
	}

	private getRectFromBasePoint(points: Point[], localPos: Point): RectPoints {
		return {
			topLeft: this.getRotatedPoint(points[0]!, localPos),
			topRight: this.getRotatedPoint(points[1]!, localPos),
			bottomLeft: this.getRotatedPoint(points[2]!, localPos),
			bottomRight: this.getRotatedPoint(points[3]!, localPos),
		};
	}

	private getRotatedPoint(transformedPoint: Point, startPoint: Point): Point {
		return {
			x:
				transformedPoint.x * Math.cos(this.angle) +
				transformedPoint.y * Math.sin(this.angle) +
				startPoint.x,
			y:
				transformedPoint.y * Math.cos(this.angle) -
				transformedPoint.x * Math.sin(this.angle) +
				startPoint.y,
		};
	}

	private calculateIntersectPoint(pos: Point): void {
		const boundRect: Rect = {
			left: -1,
			top: -1,
			width: this.pageWidth + 2,
			height: this.pageHeight + 2,
		};

		if (this.corner === FlipCorner.TOP) {
			this.topIntersectPoint = Helper.GetIntersectBetweenTwoSegment(
				boundRect,
				[pos, this.rect.topRight],
				[
					{ x: 0, y: 0 },
					{ x: this.pageWidth, y: 0 },
				],
			);

			this.sideIntersectPoint = Helper.GetIntersectBetweenTwoSegment(
				boundRect,
				[pos, this.rect.bottomLeft],
				[
					{ x: this.pageWidth, y: 0 },
					{ x: this.pageWidth, y: this.pageHeight },
				],
			);

			this.bottomIntersectPoint = Helper.GetIntersectBetweenTwoSegment(
				boundRect,
				[this.rect.bottomLeft, this.rect.bottomRight],
				[
					{ x: 0, y: this.pageHeight },
					{ x: this.pageWidth, y: this.pageHeight },
				],
			);
		} else {
			this.topIntersectPoint = Helper.GetIntersectBetweenTwoSegment(
				boundRect,
				[this.rect.topLeft, this.rect.topRight],
				[
					{ x: 0, y: 0 },
					{ x: this.pageWidth, y: 0 },
				],
			);

			this.sideIntersectPoint = Helper.GetIntersectBetweenTwoSegment(
				boundRect,
				[pos, this.rect.topLeft],
				[
					{ x: this.pageWidth, y: 0 },
					{ x: this.pageWidth, y: this.pageHeight },
				],
			);

			this.bottomIntersectPoint = Helper.GetIntersectBetweenTwoSegment(
				boundRect,
				[this.rect.bottomLeft, this.rect.bottomRight],
				[
					{ x: 0, y: this.pageHeight },
					{ x: this.pageWidth, y: this.pageHeight },
				],
			);
		}
	}

	private checkPositionAtCenterLine(
		checkedPos: Point,
		centerOne: Point,
		centerTwo: Point,
	): Point {
		let result = checkedPos;

		const tmp = Helper.LimitPointToCircle(centerOne, this.pageWidth, result);

		if (result !== tmp) {
			result = tmp;
			this.updateAngleAndGeometry(result);
		}

		const rad = Math.sqrt(Math.pow(this.pageWidth, 2) + Math.pow(this.pageHeight, 2));

		let checkPointOne = this.rect.bottomRight;
		let checkPointTwo = this.rect.topLeft;

		if (this.corner === FlipCorner.BOTTOM) {
			checkPointOne = this.rect.topRight;
			checkPointTwo = this.rect.bottomLeft;
		}

		if (checkPointOne.x <= 0) {
			const bottomPoint = Helper.LimitPointToCircle(centerTwo, rad, checkPointTwo);

			if (bottomPoint !== result) {
				result = bottomPoint;
				this.updateAngleAndGeometry(result);
			}
		}

		return result;
	}

	private getSegmentToShadowLine(): Segment {
		const first = this.getShadowStartPoint();

		const second =
			first !== this.sideIntersectPoint && this.sideIntersectPoint !== null
				? this.sideIntersectPoint
				: (this.bottomIntersectPoint ?? first);

		return [first, second];
	}
}
