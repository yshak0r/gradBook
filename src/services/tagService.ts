import { Tag } from '@/models/Tag';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { ITag } from '@/types';

class TagService {
  
  public async getAllTags(): Promise<ITag[]> {
    try {
      const tags = await Tag.find({ isActive: true })
        .sort({ usageCount: -1, name: 1 });

      return tags;
    } catch (error) {
      logger.error('Error fetching all tags:', error);
      throw error;
    }
  }

  public async getTagsByCategory(category: string): Promise<ITag[]> {
    try {
      const tags = await Tag.find({ 
        category, 
        isActive: true 
      }).sort({ usageCount: -1, name: 1 });

      return tags;
    } catch (error) {
      logger.error('Error fetching tags by category:', error);
      throw error;
    }
  }

  public async getPopularTags(limit: number = 20): Promise<ITag[]> {
    try {
      const tags = await Tag.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(limit);

      return tags;
    } catch (error) {
      logger.error('Error fetching popular tags:', error);
      throw error;
    }
  }

  public async searchTags(query: string): Promise<ITag[]> {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      const tags = await Tag.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      }).sort({ usageCount: -1 });

      return tags;
    } catch (error) {
      logger.error('Error searching tags:', error);
      throw error;
    }
  }

  public async createTag(tagData: {
    name: string;
    description?: string;
    category: string;
  }): Promise<ITag> {
    try {
      // Check if tag already exists
      const existingTag = await Tag.findOne({ 
        name: tagData.name.toLowerCase() 
      });

      if (existingTag) {
        throw new Error('Tag already exists');
      }

      const tag = await Tag.create({
        ...tagData,
        name: tagData.name.toLowerCase()
      });
      
      logger.info(`Tag created: ${tag._id}`);
      
      return tag;
    } catch (error) {
      logger.error('Error creating tag:', error);
      throw error;
    }
  }

  public async updateTag(
    tagId: string, 
    updates: Partial<ITag>
  ): Promise<ITag | null> {
    try {
      const tag = await Tag.findByIdAndUpdate(
        tagId,
        updates,
        { new: true, runValidators: true }
      );

      if (tag) {
        logger.info(`Tag updated: ${tagId}`);
      }

      return tag;
    } catch (error) {
      logger.error('Error updating tag:', error);
      throw error;
    }
  }

  public async deleteTag(tagId: string): Promise<boolean> {
    try {
      const result = await Tag.findByIdAndUpdate(
        tagId,
        { isActive: false },
        { new: true }
      );

      if (result) {
        logger.info(`Tag deleted: ${tagId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting tag:', error);
      throw error;
    }
  }

  public async incrementTagUsage(tagIds: string[]): Promise<void> {
    try {
      await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $inc: { usageCount: 1 } }
      );

      logger.info(`Tag usage incremented for ${tagIds.length} tags`);
    } catch (error) {
      logger.error('Error incrementing tag usage:', error);
      throw error;
    }
  }

  public async getTagCategories(): Promise<string[]> {
    try {
      const categories = await Tag.distinct('category', { isActive: true });
      return categories;
    } catch (error) {
      logger.error('Error fetching tag categories:', error);
      throw error;
    }
  }

  public async getUserTags(userId: string): Promise<ITag[]> {
    try {
      const user = await User.findById(userId).populate('tags');
      return user?.tags || [];
    } catch (error) {
      logger.error('Error fetching user tags:', error);
      throw error;
    }
  }

  public async getTagStats(): Promise<{
    totalTags: number;
    totalCategories: number;
    mostUsedTag: ITag | null;
    averageUsage: number;
  }> {
    try {
      const [totalTags, categories, mostUsedTag, usageStats] = await Promise.all([
        Tag.countDocuments({ isActive: true }),
        Tag.distinct('category', { isActive: true }),
        Tag.findOne({ isActive: true }).sort({ usageCount: -1 }),
        Tag.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, avgUsage: { $avg: '$usageCount' } } }
        ])
      ]);

      return {
        totalTags,
        totalCategories: categories.length,
        mostUsedTag,
        averageUsage: usageStats[0]?.avgUsage || 0
      };
    } catch (error) {
      logger.error('Error fetching tag stats:', error);
      throw error;
    }
  }
}

export const tagService = new TagService();