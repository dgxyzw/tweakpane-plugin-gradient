export type GradientPoint = {
  id: string;
  time: number;
  value: { r: number, g: number, b: number, a: number };
}

export type GradientOptions = {
  points: Array<Omit<GradientPoint, 'id'>>;
}

export class Gradient {
  static idCounter = 0;

  points: Array<GradientPoint>;

  constructor(options: GradientOptions) {
    this.points = options.points.map((point) => {
      return { id: (Gradient.idCounter++).toString(10), ...point };
    });
  }

  public getInterpolatedColor(time: number): { r: number, g: number, b: number, a: number } {
    const points = this.points;
    const pointCount = points.length;

    let leftIndex: number | null = null;
    let leftIndexTime = 0;
    let rightIndex: number | null = null;
    let rightIndexTime = 1;

    for (let i = 0; i < pointCount; i++) {
      const point = points[i];

      if (!point) throw new Error('Point not found');

      if (point.time < time && (leftIndex === null || (point.time > leftIndexTime))) {
        leftIndex = i;
        leftIndexTime = point.time;
      }

      if (point.time > time && (rightIndex === null || (point.time < rightIndexTime))) {
        rightIndex = i;
        rightIndexTime = point.time;
      }
    }

    const leftPoint = leftIndex === null ? undefined : points[leftIndex];
    const rightPoint = rightIndex === null ? undefined : points[rightIndex];

    if (!leftPoint && !rightPoint) throw new Error('Point not found');

    if (leftPoint?.time === rightPoint?.time) throw new Error('Left and right points have the same time');

    const rgba = { r: 0, g: 0, b: 0, a: 0 };

    if (leftPoint?.time !== undefined && rightPoint?.time !== undefined) {
      const t = (time - leftPoint.time) / (rightPoint.time - leftPoint.time);

      const leftValue = leftPoint.value;
      const rightValue = rightPoint.value;

      rgba.r = leftValue.r + (rightValue.r - leftValue.r) * t;
      rgba.g = leftValue.g + (rightValue.g - leftValue.g) * t;
      rgba.b = leftValue.b + (rightValue.b - leftValue.b) * t;
      rgba.a = leftValue.a + (rightValue.a - leftValue.a) * t;
    } else if (leftPoint) {
      rgba.r = leftPoint.value.r;
      rgba.g = leftPoint.value.g;
      rgba.b = leftPoint.value.b;
      rgba.a = leftPoint.value.a;
    } else if (rightPoint) {
      rgba.r = rightPoint.value.r;
      rgba.g = rightPoint.value.g;
      rgba.b = rightPoint.value.b;
      rgba.a = rightPoint.value.a;
    }


    return rgba;
  }

  public addPoint(pointParams: Omit<GradientPoint, 'id'>): GradientPoint {
    const point = { id: (Gradient.idCounter++).toString(10), ...pointParams };

    if (this.points.find((p) => p.time === point.time)) throw new Error('Point with this time already exists');

    this.points.push(point);
    this.sortPoints();

    return point;
  }

  public removePointById(id: string) {
    const pointIndex = this.points.findIndex((point) => point.id === id);

    if (pointIndex === -1) throw new Error('Point not found');

    this.points.splice(pointIndex, 1);
  }

  public getPointById(id: string): GradientPoint {
    const point = this.points.find((point) => point.id === id);

    if (!point) throw new Error('Point not found');

    return point;
  }

  public tryGetSameTimePoint(point: GradientPoint): GradientPoint | null {
    const samePoint = this.points.find((p) => {
      if (point.id === p.id) return false;

      return p.time === point.time;
    });

    return samePoint ?? null;
  }

  public toCssGradient(): string {
    const points = this.points;
    const pointCount = points.length;

    let css = 'linear-gradient(to right, ';

    for (let i = 0; i < pointCount; i++) {
      const point = points[i];

      if (!point) throw new Error('Point not found');

      const rgba = `rgba(${point.value.r}, ${point.value.g}, ${point.value.b}, ${point.value.a}) ${point.time * 100}%`;

      css += rgba;

      if (i < pointCount - 1) {
        css += ', ';
      }
    }

    css += ')';

    return css;
  }

  public sortPoints() {
    this.points.sort((a, b) => a.time - b.time);
  }

  public clone(): Gradient {
    this.sortPoints();

    return new Gradient({
      points: this.points.map((point) => ({
        ...point,
        value: ({ ...point.value }),
      })),
    });
  }

  public isEqual(other: Gradient): boolean {
    if (this.points.length !== other.points.length) return false;

    this.sortPoints();
    other.sortPoints();

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const otherPoint = other.points[i];

      if (point.time !== otherPoint.time) return false;
      if (point.value.r !== otherPoint.value.r) return false;
      if (point.value.g !== otherPoint.value.g) return false;
      if (point.value.b !== otherPoint.value.b) return false;
      if (point.value.a !== otherPoint.value.a) return false;
    }

    return true;
  }
}
