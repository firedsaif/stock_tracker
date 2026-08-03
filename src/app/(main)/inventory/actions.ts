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
  
  const vendorName = formData.get('vendor_name') as string || null
  const vendorContact = formData.get('vendor_contact') as string || null
  const unitCost = parseFloat(formData.get('unit_cost') as string) || null

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
    const totalCost = unitCost ? (unitCost * initialStock) : 0;
    
    // Record initial stock transaction
    await supabase.from('transactions').insert([{
      product_id: data[0].id,
      product_name: name,
      product_unit: unit,
      type: 'ADD',
      quantity: initialStock,
      notes: 'Initial stock',
      vendor_name: vendorName,
      vendor_contact: vendorContact,
      unit_cost: unitCost,
      user_id: user.id,
      user_email: user.email
    }])
    
    // Deduct from Company Balance
    if (totalCost > 0) {
      const { data: balanceData } = await supabase
        .from('company_balance')
        .select('balance')
        .eq('id', 1)
        .single()
        
      if (balanceData) {
        await supabase
          .from('company_balance')
          .update({ 
            balance: balanceData.balance - totalCost,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
      }
    }
  }

  revalidatePath('/inventory')
  revalidatePath('/finance')
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
  
  // Sell details
  const soldTo = formData.get('sold_to') as string || null
  const contact = formData.get('contact') as string || null
  
  // Vendor details (for ADD)
  const vendorName = formData.get('vendor_name') as string || null
  const vendorContact = formData.get('vendor_contact') as string || null
  const unitCost = parseFloat(formData.get('unit_cost') as string) || null

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

  const isSell = type === 'SELL';
  const unitPrice = isSell ? product.price : null;
  const totalPrice = isSell ? (product.price * quantity) : null;
  
  // For ADD transactions, calculate total cost to deduct from company balance
  const totalCost = (!isSell && unitCost) ? (unitCost * quantity) : 0;

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
      vendor_name: !isSell ? vendorName : null,
      vendor_contact: !isSell ? vendorContact : null,
      unit_cost: !isSell ? unitCost : null,
      unit_price: unitPrice,
      total_price: totalPrice,
      user_id: user.id,
      user_email: user.email
    }])

  if (txError) {
    console.error('Transaction log failed:', txError)
  }

  // 3. Update Company Balance
  const { data: balanceData } = await supabase
    .from('company_balance')
    .select('balance')
    .eq('id', 1)
    .single()
    
  if (balanceData) {
    let newBalance = balanceData.balance
    if (isSell && totalPrice) {
      newBalance += totalPrice
    } else if (!isSell && totalCost > 0) {
      newBalance -= totalCost
    }
    
    if (newBalance !== balanceData.balance) {
      await supabase
        .from('company_balance')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', 1)
    }
  }

  revalidatePath('/inventory')
  revalidatePath('/transactions')
  revalidatePath('/finance')
  revalidatePath('/')
  return { success: true }
}
