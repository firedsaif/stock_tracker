'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { getUserRole } from '@/utils/roles'

export async function deleteProduct(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Members cannot delete products' }
  }

  const productId = formData.get('product_id') as string
  if (!productId) {
    return { error: 'Product ID is required' }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return { error: error.message }
  }

  revalidatePath('/inventory')
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { role } = await getUserRole()
  if (role === 'MEMBER') {
    return { error: 'Members cannot add products' }
  }

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const unit = formData.get('unit') as string || 'Pieces'
  const initialStock = parseInt(formData.get('stock') as string) || 0
  const lowStockLimit = parseInt(formData.get('low_stock_limit') as string) || 20
  const price = parseFloat(formData.get('price') as string) || 0

  const { data, error } = await supabase
    .from('products')
    .insert([{
      name,
      category,
      unit,
      stock: initialStock,
      low_stock_limit: lowStockLimit,
      price,
      user_id: user.id,
      user_email: user.email
    }])
    .select()

  if (error) {
    console.error('Error adding product:', error)
    return { error: error.message }
  }

  if (initialStock > 0 && data && data.length > 0) {
    // Record initial stock transaction
    await supabase.from('transactions').insert([{
      product_id: data[0].id,
      product_name: name,
      product_unit: unit,
      type: 'ADD',
      quantity: initialStock,
      notes: 'Initial stock',
      user_id: user.id,
      user_email: user.email
    }])
  }

  revalidatePath('/inventory')
  revalidatePath('/')
  return { success: true }
}

export async function processTransaction(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { role } = await getUserRole()
  if (role === 'MEMBER') {
    return { error: 'Members cannot process transactions' }
  }

  const productId = formData.get('product_id') as string
  const type = formData.get('type') as 'ADD' | 'SELL'
  const quantity = parseInt(formData.get('quantity') as string)
  const notes = formData.get('notes') as string
  const soldTo = formData.get('sold_to') as string || null
  const contact = formData.get('contact') as string || null

  if (!quantity || quantity <= 0) {
    return { error: 'Quantity must be greater than 0' }
  }

  // Get current stock and price
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock, price, name, unit')
    .eq('id', productId)
    .single()

  if (fetchError || !product) {
    return { error: 'Product not found' }
  }

  if (type === 'SELL' && product.stock < quantity) {
    return { error: 'Cannot sell more than available stock' }
  }

  const newStock = type === 'ADD' 
    ? product.stock + quantity 
    : product.stock - quantity

  // For ADD transactions we usually don't set unit_price and total_price unless it's a purchase from a supplier.
  // The user wants receipt for SELL. So we will set these primarily for SELL.
  // But setting it for ADD is fine too if we consider `price` the selling price, but we'll leave them null for ADD.
  const isSell = type === 'SELL';
  const unitPrice = isSell ? product.price : null;
  const totalPrice = isSell ? (product.price * quantity) : null;

  // Perform updates in a transaction-like way
  
  // 1. Update product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)

  if (updateError) {
    return { error: 'Failed to update stock' }
  }

  // 2. Record transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert([{
      product_id: productId,
      product_name: product.name,
      product_unit: product.unit,
      type,
      quantity,
      notes,
      sold_to: isSell ? soldTo : null,
      contact: isSell ? contact : null,
      unit_price: unitPrice,
      total_price: totalPrice,
      user_id: user.id,
      user_email: user.email
    }])

  if (txError) {
    // Ideally we would rollback the stock update here if this fails, but keeping it simple
    console.error('Transaction log failed:', txError)
  }

  revalidatePath('/inventory')
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}
