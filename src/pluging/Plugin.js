function paginatePlugin(schema) {
  schema.statics.paginate = function (queryString = {}, options = {}) {
    const queryObj = { ...queryString };

    const excludedFields = ["page", "limit", "sort", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    const sanitizedQuery = {};
    for (const key in queryObj) {
      if (typeof queryObj[key] !== 'object' && queryObj[key] !== undefined) {
        sanitizedQuery[key] = queryObj[key];
      }
    }

    let mongoQuery = this.find(sanitizedQuery);

    // 1. منطق البحث (إن وُجد)
    if (queryString.search && options.searchFields) {
      mongoQuery = mongoQuery.find({
        $or: options.searchFields.map((field) => ({
          [field]: { $regex: queryString.search, $options: "i" },
        })),
      });
    }

    // 2. اختيار الحقول المحددة (Select)
    if (options.select) {
      mongoQuery = mongoQuery.select(options.select);
    }

    // 3. ربط العلاقات (Populate)
    if (options.populate) {
      mongoQuery = mongoQuery.populate(options.populate);
    }

    // 4. الترتيب (Sorting)
    if (queryString.sort) {
      const sortBy = queryString.sort.split(",").join(" ");
      mongoQuery = mongoQuery.sort(sortBy);
    } else {
      mongoQuery = mongoQuery.sort("-createdAt");
    }

    // 5. الترقيم الصفحي (Pagination)
    const page = Math.max(1, parseInt(queryString.page, 10)) || 1;
    const limit = Math.min(100, parseInt(queryString.limit, 10)) || 5;
    const skip = (page - 1) * limit;

    mongoQuery = mongoQuery.skip(skip).limit(limit);

    // 6. بناء وتنفيذ دالة execPaginate المخصصة خارج الشروط لتكون متاحة دائماً
    mongoQuery.execPaginate = async function () {
      const total = await this.model.countDocuments(this.getQuery());
      const data = await this.exec();
      const pages = Math.ceil(total / limit);

      return {
        total,
        page,
        pages,
        limit,
        isNext: page < pages,
        isPrevious: page > 1,
        data,
      };
    };

    return mongoQuery;
  };
}

module.exports = paginatePlugin;

