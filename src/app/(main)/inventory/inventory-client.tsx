'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { addProduct, processTransaction, deleteProduct } from './actions'
import { Search, Plus, ArrowDown, ArrowUp, Trash2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  low_stock_limit: number
  price: number
}

export function InventoryClient({ initialProducts, userRole }: { initialProducts: Product[], userRole: string | null }) {
  const [search, setSearch] = useState('')
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [transactionOpen, setTransactionOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'ADD' | 'SELL'>('ADD')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const canManage = userRole === 'SUPER_OWNER' || userRole === 'OWNER'

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddProduct = async (formData: FormData) => {
    await addProduct(formData)
    setAddProductOpen(false)
  }

  const handleTransaction = async (formData: FormData) => {
    if (selectedProduct) {
      formData.append('product_id', selectedProduct.id)
      formData.append('type', transactionType)
      const result = await processTransaction(formData)
      if (result.error) {
        alert(result.error)
      } else {
        setTransactionOpen(false)
        setSelectedProduct(null)
      }
    }
  }

  const openTransactionModal = (product: Product, type: 'ADD' | 'SELL') => {
    setSelectedProduct(product)
    setTransactionType(type)
    setTransactionOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        {canManage && (
          <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <form action={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input id="category" name="category" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" name="unit" defaultValue="Pieces" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price (per unit)</Label>
                    <Input id="price" name="price" type="number" step="0.01" min="0" required />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-4">Initial Stock Details (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Initial Quantity</Label>
                      <Input id="stock" name="stock" type="number" min="0" defaultValue="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit_cost">Cost Price (per unit)</Label>
                      <Input id="unit_cost" name="unit_cost" type="number" step="0.01" min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor_name">Vendor Name</Label>
                      <Input id="vendor_name" name="vendor_name" placeholder="Supplier name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor_contact">Vendor Contact</Label>
                      <Input id="vendor_contact" name="vendor_contact" placeholder="Phone or email" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_limit">Low Stock Limit</Label>
                  <Input id="low_stock_limit" name="low_stock_limit" type="number" min="0" defaultValue="20" required />
                </div>
                <Button type="submit" className="w-full">Save Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-y">
                <tr>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Product Name</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Category</th>
                  <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Stock</th>
                  {canManage && <th className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {product.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                      {product.category || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${product.stock <= product.low_stock_limit ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                      <span className="text-gray-500 ml-1 text-xs">{product.unit}</span>
                    </td>
                    {canManage && (
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            onClick={() => openTransactionModal(product, 'ADD')}
                          >
                            <ArrowUp className="h-3 w-3" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => openTransactionModal(product, 'SELL')}
                          >
                            <ArrowDown className="h-3 w-3" />
                            <span className="hidden sm:inline">Sell</span>
                          </Button>
                          <form action={async (formData) => { await deleteProduct(formData) }} onSubmit={(e) => { if(!confirm('Are you sure you want to completely remove this product and all its history?')) e.preventDefault() }}>
                            <input type="hidden" name="product_id" value={product.id} />
                            <Button 
                              type="submit"
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="px-6 py-8 text-center text-gray-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'ADD' ? 'Add Stock' : 'Sell Stock'} - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <form action={handleTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({selectedProduct?.unit})</Label>
              <Input 
                id="quantity" 
                name="quantity" 
                type="number" 
                min="1" 
                max={transactionType === 'SELL' ? selectedProduct?.stock : undefined}
                required 
              />
              {transactionType === 'SELL' && (
                <p className="text-xs text-muted-foreground">Available: {selectedProduct?.stock} {selectedProduct?.unit} | Price: RS {selectedProduct?.price}</p>
              )}
            </div>
            {transactionType === 'ADD' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Cost Price (per unit)</Label>
                  <Input id="unit_cost" name="unit_cost" type="number" step="0.01" min="0" placeholder="e.g. 5.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor Name</Label>
                  <Input id="vendor_name" name="vendor_name" placeholder="Supplier name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_contact">Vendor Contact</Label>
                  <Input id="vendor_contact" name="vendor_contact" placeholder="Phone or email" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sold_to">Sold To / Customer</Label>
                  <Input id="sold_to" name="sold_to" placeholder="Customer name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Details</Label>
                  <Input id="contact" name="contact" placeholder="Phone or email" />
                </div>
              </>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" name="notes" placeholder={transactionType === 'ADD' ? 'e.g., Restock from supplier X' : 'e.g., Additional notes'} />
            </div>
            <Button 
              type="submit" 
              className={`w-full ${transactionType === 'ADD' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {transactionType === 'ADD' ? 'Add to Stock' : 'Record Sale'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
