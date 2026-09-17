import mongoose from 'mongoose';
import { addDbTime } from '../utils/requestTiming';

function elapsedMs(started: bigint | undefined): number {
  if (!started) return 0;
  return Number(process.hrtime.bigint() - started) / 1e6;
}

type Timed = { __timingStart?: bigint };

const QUERY_OPS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'countDocuments',
  'distinct',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'estimatedDocumentCount',
] as const;

export function queryTimingPlugin(schema: mongoose.Schema): void {
  for (const op of QUERY_OPS) {
    schema.pre(op, function (this: Timed) {
      this.__timingStart = process.hrtime.bigint();
    });
    schema.post(op, function (this: Timed) {
      addDbTime(elapsedMs(this.__timingStart));
    });
  }

  schema.pre(/^aggregate$/, function (this: Timed) {
    this.__timingStart = process.hrtime.bigint();
  });
  schema.post(/^aggregate$/, function (this: Timed) {
    addDbTime(elapsedMs(this.__timingStart));
  });

  schema.pre('save', function (this: Timed) {
    this.__timingStart = process.hrtime.bigint();
  });
  schema.post('save', function (this: Timed) {
    addDbTime(elapsedMs(this.__timingStart));
  });
}

mongoose.plugin(queryTimingPlugin);
