import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models/Review';
import { Product } from '@/lib/models/Product';

const toReviewProductIdVariants = (value: unknown): Array<string | number | mongoose.Types.ObjectId> => {
  const raw = String(value ?? '').trim();
  if (!raw) return [];

  const variants = new Map<string, string | number | mongoose.Types.ObjectId>();
  variants.set(`str:${raw}`, raw);

  if (/^\d+$/.test(raw)) {
    variants.set(`num:${raw}`, Number(raw));
  }

  if (mongoose.Types.ObjectId.isValid(raw)) {
    variants.set(`oid:${raw}`, new mongoose.Types.ObjectId(raw));
  }

  return Array.from(variants.values());
};

const toProductLookupId = (value: unknown): string | number => {
  const raw = String(value ?? '').trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const productIds = request.nextUrl.searchParams.get('productIds');
    const productId = request.nextUrl.searchParams.get('productId');
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, Number(request.nextUrl.searchParams.get('limit') || '5')));

    if (productIds) {
      const ids = productIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (!ids.length) {
        return NextResponse.json({ summaries: {} }, { status: 200 });
      }

      const reviewIdVariants = ids.flatMap((id) => toReviewProductIdVariants(id));

      const reviews = await Review.find({ productId: { $in: reviewIdVariants } })
        .sort({ createdAt: -1 })
        .lean();

      const grouped: Record<
        string,
        { total: number; ratingSum: number; latestComment?: string; latestUserName?: string }
      > = {};

      for (const id of ids) {
        grouped[id] = { total: 0, ratingSum: 0 };
      }

      for (const review of reviews) {
        const reviewProductId = String(review.productId);
        const key = ids.find((candidate) => toReviewProductIdVariants(candidate).some((variant) => String(variant) === reviewProductId));
        if (!key || !grouped[key]) continue;

        grouped[key].total += 1;
        grouped[key].ratingSum += Number(review.rating || 0);

        if (!grouped[key].latestComment && review.comment) {
          grouped[key].latestComment = review.comment;
          grouped[key].latestUserName = review.userName || 'User';
        }
      }

      const summaries: Record<
        string,
        { averageRating: number; total: number; latestComment?: string; latestUserName?: string }
      > = {};

      Object.entries(grouped).forEach(([key, value]) => {
        summaries[key] = {
          total: value.total,
          averageRating: value.total > 0 ? Number((value.ratingSum / value.total).toFixed(1)) : 0,
          latestComment: value.latestComment,
          latestUserName: value.latestUserName,
        };
      });

      return NextResponse.json({ summaries }, { status: 200 });
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const productIdVariants = toReviewProductIdVariants(productId);
    if (!productIdVariants.length) {
      return NextResponse.json(
        {
          message: 'No reviews available for this product',
          reviews: [],
          total: 0,
          averageRating: 0,
          page,
          limit,
          hasMore: false,
        },
        { status: 200 }
      );
    }

    const total = await Review.countDocuments({ productId: { $in: productIdVariants } });
    const reviews = await Review.find({ productId: { $in: productIdVariants } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const allRatings = await Review.find({ productId: { $in: productIdVariants } }).select('rating').lean();
    const averageRating =
      allRatings.length > 0
        ? Number(
            (
              allRatings.reduce((sum, current) => sum + Number(current.rating || 0), 0) /
              allRatings.length
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json(
      {
        message: 'Reviews fetched successfully',
        reviews,
        total,
        averageRating,
        page,
        limit,
        hasMore: page * limit < total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, productId, rating, title, comment, userName } = body;

    if (!userId || !productId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const productIdVariants = toReviewProductIdVariants(productId);
    if (!productIdVariants.length) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const normalizedProductId = String(productId).trim();

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.split(' ')[1]?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await Review.findOne({ userId, productId: { $in: productIdVariants } });

    let review;
    if (existing) {
      existing.rating = parsedRating;
      existing.title = title;
      existing.comment = comment;
      existing.userName = userName;
      review = await existing.save();
    } else {
      review = await Review.create({
        userId,
        productId: normalizedProductId,
        rating: parsedRating,
        title,
        comment,
        userName,
      });
    }

    const productReviews = await Review.find({ productId: { $in: productIdVariants } }).select('rating').lean();
    const total = productReviews.length;
    const averageRating =
      total > 0
        ? Number(
            (
              productReviews.reduce((sum, current) => sum + Number(current.rating || 0), 0) / total
            ).toFixed(1)
          )
        : 0;

    await Product.findOneAndUpdate({ _id: toProductLookupId(normalizedProductId) }, {
      rating: averageRating,
      reviews: total,
    });

    return NextResponse.json(
      {
        message: 'Review posted successfully',
        review,
        productStats: {
          averageRating,
          total,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
