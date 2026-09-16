import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Since we have ON DELETE CASCADE on the foreign keys,
    // deleting import_batches will automatically delete the related orders and order_items
    // We also delete orders directly just in case some orders were created without a batch
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('user_id', user.id)

    if (ordersError) {
      console.error('Error deleting orders:', ordersError)
      return NextResponse.json({ error: 'Gagal mereset data orders' }, { status: 500 })
    }

    const { error: batchError } = await supabase
      .from('import_batches')
      .delete()
      .eq('user_id', user.id)

    if (batchError) {
      console.error('Error deleting import batches:', batchError)
      return NextResponse.json({ error: 'Gagal mereset riwayat import' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Semua data laporan berhasil direset' })
  } catch (error: any) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
