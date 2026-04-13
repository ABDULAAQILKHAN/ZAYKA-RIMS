import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/services/supabase"
import { getRoleFromUserMetadata, isAllowedRimsRole } from "@/lib/auth"
import type {
  Ingredient,
  IngredientInput,
  Invoice,
  MenuItemRecord,
  MenuItemWithRecipe,
  OrderItemInput,
  OrderRecord,
  RecipeIngredient,
  RimsRole,
} from "@/types"

interface ApiError {
  status: number | string
  data: { message: string }
}

interface LoginPayload {
  email: string
  password: string
}

interface AuthResult {
  user: User
  role: RimsRole
  access_token: string
}

interface MapRecipePayload {
  menu_item_id: string
  ingredients: RecipeIngredient[]
}

interface CreateOrderPayload {
  items: OrderItemInput[]
  status?: OrderRecord["status"]
}

interface CreateInvoicePayload {
  order_id: string
}

interface DashboardStats {
  total_ingredients: number
  low_stock_count: number
  total_orders: number
  total_revenue: number
}

function toApiError(error: unknown, fallbackMessage: string): ApiError {
  if (error instanceof Error) {
    return { status: "CUSTOM_ERROR", data: { message: error.message } }
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return {
      status: "CUSTOM_ERROR",
      data: { message: String((error as { message: unknown }).message) },
    }
  }

  return { status: "CUSTOM_ERROR", data: { message: fallbackMessage } }
}

async function resolveUserRole(user: User): Promise<RimsRole | null> {
  const supabase = createClient()
  const metadataRole = getRoleFromUserMetadata(user)
  if (metadataRole) {
    return metadataRole as RimsRole
  }

  const byUserId = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (byUserId.data?.role) {
    return byUserId.data.role as RimsRole
  }

  const byId = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (byId.data?.role) {
    return byId.data.role as RimsRole
  }

  return null
}

async function recalculateMenuAvailability(): Promise<void> {
  const supabase = createClient()

  const { data: menuItems, error: menuItemsError } = await supabase
    .from("menu_items")
    .select("id")

  if (menuItemsError) {
    throw menuItemsError
  }

  for (const menuItem of menuItems ?? []) {
    const { data: recipeRows, error: recipeError } = await supabase
      .from("menu_recipes")
      .select("ingredient_id, quantity_required")
      .eq("menu_item_id", menuItem.id)

    if (recipeError) {
      throw recipeError
    }

    const recipe = recipeRows ?? []
    if (recipe.length === 0) {
      await supabase
        .from("menu_items")
        .update({ is_available: true })
        .eq("id", menuItem.id)
      continue
    }

    const ingredientIds = recipe.map((row) => row.ingredient_id)
    const { data: ingredientRows, error: ingredientError } = await supabase
      .from("ingredients")
      .select("id, current_stock")
      .in("id", ingredientIds)

    if (ingredientError) {
      throw ingredientError
    }

    const stockMap = new Map<string, number>(
      (ingredientRows ?? []).map((row) => [row.id as string, Number(row.current_stock)]),
    )

    const isAvailable = recipe.every((row) => {
      const stock = stockMap.get(row.ingredient_id as string) ?? 0
      return stock >= Number(row.quantity_required)
    })

    await supabase
      .from("menu_items")
      .update({ is_available: isAvailable })
      .eq("id", menuItem.id)
  }
}

async function deductIngredientsForOrder(items: OrderItemInput[]): Promise<void> {
  const supabase = createClient()
  const menuItemIds = items.map((item) => item.menu_item_id)

  const { data: recipeRows, error: recipeError } = await supabase
    .from("menu_recipes")
    .select("menu_item_id, ingredient_id, quantity_required")
    .in("menu_item_id", menuItemIds)

  if (recipeError) {
    throw recipeError
  }

  const deductionByIngredient = new Map<string, number>()

  for (const item of items) {
    const recipeForItem = (recipeRows ?? []).filter(
      (row) => row.menu_item_id === item.menu_item_id,
    )

    for (const row of recipeForItem) {
      const previous = deductionByIngredient.get(row.ingredient_id as string) ?? 0
      const toDeduct = Number(row.quantity_required) * item.quantity
      deductionByIngredient.set(row.ingredient_id as string, previous + toDeduct)
    }
  }

  const ingredientIds = Array.from(deductionByIngredient.keys())
  if (ingredientIds.length === 0) {
    return
  }

  const { data: ingredientRows, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id, current_stock")
    .in("id", ingredientIds)

  if (ingredientError) {
    throw ingredientError
  }

  for (const ingredient of ingredientRows ?? []) {
    const currentStock = Number(ingredient.current_stock)
    const deduction = deductionByIngredient.get(ingredient.id as string) ?? 0
    const nextStock = Math.max(0, currentStock - deduction)

    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ current_stock: nextStock })
      .eq("id", ingredient.id)

    if (updateError) {
      throw updateError
    }
  }

  await recalculateMenuAvailability()
}

export const rimsApi = createApi({
  reducerPath: "rimsApi",
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ["Auth", "Ingredient", "Menu", "Recipe", "Order", "Invoice", "Dashboard"],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      async queryFn() {
        try {
          const supabase = createClient()

          const [ingredientsRes, ordersRes] = await Promise.all([
            supabase.from("ingredients").select("id, current_stock, min_stock"),
            supabase.from("orders").select("id, total"),
          ])

          if (ingredientsRes.error) {
            throw ingredientsRes.error
          }
          if (ordersRes.error) {
            throw ordersRes.error
          }

          const ingredients = ingredientsRes.data ?? []
          const orders = ordersRes.data ?? []

          const totalRevenue = orders.reduce(
            (sum, order) => sum + Number(order.total ?? 0),
            0,
          )

          return {
            data: {
              total_ingredients: ingredients.length,
              low_stock_count: ingredients.filter(
                (ingredient) =>
                  Number(ingredient.current_stock) <= Number(ingredient.min_stock),
              ).length,
              total_orders: orders.length,
              total_revenue: Number(totalRevenue.toFixed(2)),
            },
          }
        } catch (error) {
          return { error: toApiError(error, "Failed to load dashboard stats") }
        }
      },
      providesTags: ["Dashboard"],
    }),

    login: builder.mutation<AuthResult, LoginPayload>({
      async queryFn(payload) {
        try {
          const supabase = createClient()
          const { data, error } = await supabase.auth.signInWithPassword(payload)

          if (error) {
            throw error
          }

          if (!data.user || !data.session) {
            throw new Error("No active session returned from login")
          }

          const role = await resolveUserRole(data.user)
          if (!isAllowedRimsRole(role)) {
            await supabase.auth.signOut()
            throw new Error("Unauthorized access")
          }

          return {
            data: {
              user: data.user,
              role,
              access_token: data.session.access_token,
            },
          }
        } catch (error) {
          return { error: toApiError(error, "Login failed") }
        }
      },
      invalidatesTags: ["Auth"],
    }),

    getIngredients: builder.query<Ingredient[], void>({
      async queryFn() {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from("ingredients")
            .select("id, name, unit, current_stock, min_stock, created_at, updated_at")
            .order("name", { ascending: true })

          if (error) {
            throw error
          }

          return { data: (data as Ingredient[]) ?? [] }
        } catch (error) {
          return { error: toApiError(error, "Failed to load ingredients") }
        }
      },
      providesTags: ["Ingredient"],
    }),

    createIngredient: builder.mutation<Ingredient, IngredientInput>({
      async queryFn(payload) {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from("ingredients")
            .insert({
              name: payload.name,
              unit: payload.unit,
              current_stock: payload.current_stock,
              min_stock: payload.min_stock,
            })
            .select("id, name, unit, current_stock, min_stock, created_at, updated_at")
            .single()

          if (error) {
            throw error
          }

          await recalculateMenuAvailability()

          return { data: data as Ingredient }
        } catch (error) {
          return { error: toApiError(error, "Failed to create ingredient") }
        }
      },
      invalidatesTags: ["Ingredient", "Menu", "Recipe", "Dashboard"],
    }),

    updateIngredientStock: builder.mutation<
      Ingredient,
      { id: string; current_stock: number; min_stock?: number }
    >({
      async queryFn(payload) {
        try {
          const supabase = createClient()
          const updates: { current_stock: number; min_stock?: number } = {
            current_stock: payload.current_stock,
          }

          if (typeof payload.min_stock === "number") {
            updates.min_stock = payload.min_stock
          }

          const { data, error } = await supabase
            .from("ingredients")
            .update(updates)
            .eq("id", payload.id)
            .select("id, name, unit, current_stock, min_stock, created_at, updated_at")
            .single()

          if (error) {
            throw error
          }

          await recalculateMenuAvailability()
          return { data: data as Ingredient }
        } catch (error) {
          return { error: toApiError(error, "Failed to update stock") }
        }
      },
      invalidatesTags: ["Ingredient", "Menu", "Recipe", "Dashboard"],
    }),

    getMenuItems: builder.query<MenuItemWithRecipe[], void>({
      async queryFn() {
        try {
          const supabase = createClient()
          const { data: menuRows, error: menuError } = await supabase
            .from("menu_items")
            .select("id, name, description, price, is_available")
            .order("name", { ascending: true })

          if (menuError) {
            throw menuError
          }

          const menuIds = (menuRows ?? []).map((row) => row.id)
          let recipeRows: any[] = []
          if (menuIds.length > 0) {
            const recipeResult = await supabase
              .from("menu_recipes")
              .select(
                "id, menu_item_id, ingredient_id, quantity_required, ingredients(id, name, unit, current_stock)",
              )
              .in("menu_item_id", menuIds)

            if (recipeResult.error) {
              throw recipeResult.error
            }

            recipeRows = recipeResult.data ?? []
          }

          const recipeByMenuId = new Map<string, MenuItemWithRecipe["recipe"]>()

          for (const row of recipeRows ?? []) {
            const list = recipeByMenuId.get(row.menu_item_id as string) ?? []
            const ingredient = Array.isArray(row.ingredients)
              ? row.ingredients[0]
              : row.ingredients

            list.push({
              ingredient_id: row.ingredient_id as string,
              quantity_required: Number(row.quantity_required),
              ingredient_name: ingredient?.name as string | undefined,
              ingredient_unit: ingredient?.unit as string | undefined,
              current_stock:
                typeof ingredient?.current_stock === "number"
                  ? ingredient.current_stock
                  : undefined,
            })

            recipeByMenuId.set(row.menu_item_id as string, list)
          }

          const response: MenuItemWithRecipe[] = (menuRows ?? []).map((row) => ({
            id: row.id as string,
            name: row.name as string,
            description: (row.description as string) ?? "",
            price: Number(row.price),
            is_available: Boolean(row.is_available),
            recipe: recipeByMenuId.get(row.id as string) ?? [],
          }))

          return { data: response }
        } catch (error) {
          return { error: toApiError(error, "Failed to load menu") }
        }
      },
      providesTags: ["Menu", "Recipe"],
    }),

    mapRecipe: builder.mutation<{ success: true }, MapRecipePayload>({
      async queryFn(payload) {
        try {
          const supabase = createClient()
          const { error: deleteError } = await supabase
            .from("menu_recipes")
            .delete()
            .eq("menu_item_id", payload.menu_item_id)

          if (deleteError) {
            throw deleteError
          }

          if (payload.ingredients.length > 0) {
            const { error: insertError } = await supabase.from("menu_recipes").insert(
              payload.ingredients.map((ingredient) => ({
                menu_item_id: payload.menu_item_id,
                ingredient_id: ingredient.ingredient_id,
                quantity_required: ingredient.quantity_required,
              })),
            )

            if (insertError) {
              throw insertError
            }
          }

          await recalculateMenuAvailability()
          return { data: { success: true } }
        } catch (error) {
          return { error: toApiError(error, "Failed to map recipe") }
        }
      },
      invalidatesTags: ["Menu", "Recipe", "Ingredient"],
    }),

    getOrders: builder.query<OrderRecord[], void>({
      async queryFn() {
        try {
          const supabase = createClient()
          const { data: orderRows, error: orderError } = await supabase
            .from("orders")
            .select("id, status, subtotal, gst, total, created_at")
            .order("created_at", { ascending: false })

          if (orderError) {
            throw orderError
          }

          const orderIds = (orderRows ?? []).map((order) => order.id)
          let itemRows: any[] = []
          if (orderIds.length > 0) {
            const itemResult = await supabase
              .from("order_items")
              .select(
                "id, order_id, menu_item_id, quantity, unit_price, line_total, menu_items(name)",
              )
              .in("order_id", orderIds)

            if (itemResult.error) {
              throw itemResult.error
            }

            itemRows = itemResult.data ?? []
          }

          const itemsByOrderId = new Map<string, OrderRecord["items"]>()

          for (const item of itemRows ?? []) {
            const list = itemsByOrderId.get(item.order_id as string) ?? []
            const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items

            list.push({
              id: item.id as string,
              menu_item_id: item.menu_item_id as string,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              line_total: Number(item.line_total),
              menu_item_name: (menuItem?.name as string) ?? "Unknown Item",
            })

            itemsByOrderId.set(item.order_id as string, list)
          }

          const mapped: OrderRecord[] = (orderRows ?? []).map((row) => ({
            id: row.id as string,
            status: row.status as OrderRecord["status"],
            subtotal: Number(row.subtotal),
            gst: Number(row.gst),
            total: Number(row.total),
            created_at: row.created_at as string,
            items: itemsByOrderId.get(row.id as string) ?? [],
          }))

          return { data: mapped }
        } catch (error) {
          return { error: toApiError(error, "Failed to load orders") }
        }
      },
      providesTags: ["Order"],
    }),

    createOrder: builder.mutation<OrderRecord, CreateOrderPayload>({
      async queryFn(payload) {
        try {
          const supabase = createClient()

          if (payload.items.length === 0) {
            throw new Error("Please add at least one item")
          }

          const menuItemIds = payload.items.map((item) => item.menu_item_id)
          const { data: menuRows, error: menuError } = await supabase
            .from("menu_items")
            .select("id, name, price, is_available")
            .in("id", menuItemIds)

          if (menuError) {
            throw menuError
          }

          const menuById = new Map<string, MenuItemRecord>(
            (menuRows ?? []).map((item) => [
              item.id as string,
              {
                id: item.id as string,
                name: item.name as string,
                description: "",
                price: Number(item.price),
                is_available: Boolean(item.is_available),
              },
            ]),
          )

          for (const item of payload.items) {
            const menuItem = menuById.get(item.menu_item_id)
            if (!menuItem) {
              throw new Error("Invalid menu item in order")
            }
            if (menuItem.is_available === false) {
              throw new Error(`${menuItem.name} is unavailable`)
            }
          }

          const subtotal = payload.items.reduce((sum, item) => {
            const menuItem = menuById.get(item.menu_item_id)
            const price = menuItem ? Number(menuItem.price) : 0
            return sum + price * item.quantity
          }, 0)

          const gst = Number((subtotal * 0.05).toFixed(2))
          const total = Number((subtotal + gst).toFixed(2))

          const { data: insertedOrder, error: orderInsertError } = await supabase
            .from("orders")
            .insert({
              status: payload.status ?? "pending",
              subtotal,
              gst,
              total,
            })
            .select("id, status, subtotal, gst, total, created_at")
            .single()

          if (orderInsertError) {
            throw orderInsertError
          }

          const orderItemsPayload = payload.items.map((item) => {
            const menuItem = menuById.get(item.menu_item_id)
            const unitPrice = Number(menuItem?.price ?? 0)

            return {
              order_id: insertedOrder.id,
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              unit_price: unitPrice,
              line_total: Number((unitPrice * item.quantity).toFixed(2)),
            }
          })

          const { data: insertedItems, error: orderItemsError } = await supabase
            .from("order_items")
            .insert(orderItemsPayload)
            .select("id, order_id, menu_item_id, quantity, unit_price, line_total")

          if (orderItemsError) {
            throw orderItemsError
          }

          await deductIngredientsForOrder(payload.items)

          return {
            data: {
              id: insertedOrder.id as string,
              status: insertedOrder.status as OrderRecord["status"],
              subtotal: Number(insertedOrder.subtotal),
              gst: Number(insertedOrder.gst),
              total: Number(insertedOrder.total),
              created_at: insertedOrder.created_at as string,
              items: (insertedItems ?? []).map((item) => ({
                id: item.id as string,
                menu_item_id: item.menu_item_id as string,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                line_total: Number(item.line_total),
                menu_item_name:
                  menuById.get(item.menu_item_id as string)?.name ?? "Unknown Item",
              })),
            },
          }
        } catch (error) {
          return { error: toApiError(error, "Failed to create order") }
        }
      },
      invalidatesTags: ["Order", "Ingredient", "Menu", "Recipe", "Dashboard", "Invoice"],
    }),

    updateOrderStatus: builder.mutation<OrderRecord, { order_id: string; status: OrderRecord["status"] }>({
      async queryFn(payload) {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from("orders")
            .update({ status: payload.status })
            .eq("id", payload.order_id)
            .select("id, status, subtotal, gst, total, created_at")
            .single()

          if (error) {
            throw error
          }

          return {
            data: {
              id: data.id as string,
              status: data.status as OrderRecord["status"],
              subtotal: Number(data.subtotal),
              gst: Number(data.gst),
              total: Number(data.total),
              created_at: data.created_at as string,
              items: [],
            },
          }
        } catch (error) {
          return { error: toApiError(error, "Failed to update order status") }
        }
      },
      invalidatesTags: ["Order"],
    }),

    getInvoices: builder.query<Invoice[], void>({
      async queryFn() {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from("invoices")
            .select("id, order_id, subtotal, gst, total, status, created_at")
            .order("created_at", { ascending: false })

          if (error) {
            throw error
          }

          return { data: (data as Invoice[]) ?? [] }
        } catch (error) {
          return { error: toApiError(error, "Failed to load invoices") }
        }
      },
      providesTags: ["Invoice"],
    }),

    createInvoice: builder.mutation<Invoice, CreateInvoicePayload>({
      async queryFn(payload) {
        try {
          const supabase = createClient()
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, subtotal, gst, total")
            .eq("id", payload.order_id)
            .single()

          if (orderError) {
            throw orderError
          }

          const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
              order_id: order.id,
              subtotal: order.subtotal,
              gst: order.gst,
              total: order.total,
              status: "generated",
            })
            .select("id, order_id, subtotal, gst, total, status, created_at")
            .single()

          if (invoiceError) {
            throw invoiceError
          }

          return { data: invoice as Invoice }
        } catch (error) {
          return { error: toApiError(error, "Failed to generate invoice") }
        }
      },
      invalidatesTags: ["Invoice"],
    }),
  }),
})

export const {
  useCreateIngredientMutation,
  useCreateInvoiceMutation,
  useCreateOrderMutation,
  useGetDashboardStatsQuery,
  useGetIngredientsQuery,
  useGetInvoicesQuery,
  useGetMenuItemsQuery,
  useGetOrdersQuery,
  useLoginMutation,
  useMapRecipeMutation,
  useUpdateIngredientStockMutation,
  useUpdateOrderStatusMutation,
} = rimsApi
