// Representação estável da API, independente do formato interno dos modelos Sequelize.
function productOutput(instance) {
  const obj = typeof instance?.get === 'function' ? instance.get({ plain: true }) : instance;
  const categories = obj.categories ?? [];
  const images = obj.images ?? [];
  const options = obj.options ?? [];
  return {
    id: obj.id,
    enabled: obj.enabled,
    name: obj.name,
    slug: obj.slug,
    stock: obj.stock,
    description: obj.description,
    price: Number(obj.price),
    price_with_discount: Number(obj.price_with_discount),
    category_ids: categories.map((c) => c.id),
    images: images.map((img) => ({ id: img.id, content: img.path })),
    options: options.map((option) => ({
      id: option.id,
      title: option.title,
      shape: option.shape,
      radius: option.radius,
      type: option.type,
      values: Array.isArray(option.values) ? option.values : String(option.values ?? '').split(',').filter(Boolean),
    })),
  };
}
module.exports = { productOutput };
