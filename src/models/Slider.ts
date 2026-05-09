import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISlider extends Document {
  slideNumber: number;
  badge?: string;
  title: {
    first: string;
    highlight: string;
    last: string;
  };
  descHeader?: string;
  descBody: string;
  image: string;
  isActive: boolean;
}

const sliderSchema: Schema<ISlider> = new Schema(
  {
    slideNumber: { type: Number, required: true, unique: true },
    badge: { type: String, trim: true },
    title: {
      first: { type: String, required: true },
      highlight: { type: String, required: true },
      last: { type: String, required: true },
    },
    descHeader: { type: String, trim: true },
    descBody: { type: String, required: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Slider: Model<ISlider> = mongoose.models.Slider || mongoose.model<ISlider>('Slider', sliderSchema);
export default Slider;