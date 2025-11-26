import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { SOFT_DELETE_RESTAURANT_USER, DELETE_RESTAURANT_USER } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard_delete = searchParams.get('hard_delete') === 'true';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use soft delete by default, hard delete only if explicitly requested
    const mutation = hard_delete ? DELETE_RESTAURANT_USER : SOFT_DELETE_RESTAURANT_USER;
    const result = await hasuraMutation(mutation, { id });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to delete user',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const deletedUser = hard_delete 
      ? result.data?.delete_restaurant_users_by_pk
      : result.data?.update_restaurant_users_by_pk;

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedUser,
      message: hard_delete ? 'User permanently deleted' : 'User soft deleted'
    });

  } catch (error) {
    console.error('Delete Restaurant User API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

