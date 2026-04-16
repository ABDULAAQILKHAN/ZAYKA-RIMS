const fs = require('fs');
const path = require('path');

const files = [
  'types/index.ts',
  'store/api.ts',
  'app/(protected)/takeaway/page.tsx',
  'app/(protected)/billing/page.tsx',
  'app/(protected)/orders/page.tsx',
  'app/(protected)/history/page.tsx',
  'app/(protected)/dashboard/page.tsx'
];

const replaces = {
  'current_stock': 'currentStock',
  'min_stock': 'minStock',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'ingredient_id': 'ingredientId',
  'quantity_required': 'quantityRequired',
  'ingredient_name': 'ingredientName',
  'ingredient_unit': 'ingredientUnit',
  'menu_item_id': 'menuItemId',
  'order_id': 'orderId',
  'unit_price': 'unitPrice',
  'line_total': 'lineTotal',
  'menu_item_name': 'menuItemName',
  'active_order_count': 'activeOrderCount',
  'order_type': 'orderType',
  'table_id': 'tableId',
  'session_id': 'sessionId',
  'order_ids': 'orderIds',
  'closed_at': 'closedAt',
  'total_revenue': 'totalRevenue',
  'total_orders': 'totalOrders',
  'average_order_value': 'averageOrderValue',
  'order_type_breakdown': 'orderTypeBreakdown',
  'top_items': 'topItems',
  'table_utilization': 'tableUtilization',
  'session_count': 'sessionCount',
  'daily_revenue': 'dailyRevenue',
  'order_count': 'orderCount'
};

files.forEach(f => {
  const filePath = path.join('/Users/aaqilkhan/Desktop/my projects/ZAYKA-RIMS/apps/rims', f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [snake, camel] of Object.entries(replaces)) {
      content = content.replace(new RegExp(snake, 'g'), camel);
    }
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  } else {
    console.log('Missing', filePath);
  }
});
