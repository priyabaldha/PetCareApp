import { Router } from 'express';
import { guidesCollection } from '../models/guide.ts';

const guidesRouter = Router();

guidesRouter.get('/', async (_request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  const guides = await guidesCollection
    .find({ status: 'published' })
    .sort({ createdAt: 1 })
    .toArray();

  response.json({
    success: true,
    guides: guides.map((guide) => ({
      id: guide.slug || guide._id?.toHexString(),
      slug: guide.slug,
      title: guide.title,
      category: guide.category,
      sections: guide.sections,
      authorName: guide.authorName,
      reviewedBy: guide.reviewedBy,
      updatedAt: guide.updatedAt.toISOString(),
    })),
  });
});

guidesRouter.get('/:slug', async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  const slug = String(request.params.slug).trim().toLowerCase();

  const guide = await guidesCollection.findOne({
    slug,
    status: 'published',
  });

  if (!guide) {
    response.status(404).json({
      success: false,
      message: 'Guide not found.',
    });
    return;
  }

  response.json({
    success: true,
    guide: {
      id: guide.slug || guide._id?.toHexString(),
      slug: guide.slug,
      title: guide.title,
      category: guide.category,
      sections: guide.sections,
      authorName: guide.authorName,
      reviewedBy: guide.reviewedBy,
      updatedAt: guide.updatedAt.toISOString(),
    },
  });
});

export default guidesRouter;
