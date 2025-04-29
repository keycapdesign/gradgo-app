import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { fetchContactsWithBookings } from '@/utils/all-contacts';

import { columns } from '@/components/admin/contacts/columns';
import { DataTable } from '@/components/admin/data-table';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  order_type?: string;
  event_id?: string;
}

interface LoaderData {
  data: any[];
  totalCount: number;
  page: number;
  pageSize: number;
  title: string;
}

export const Route = createFileRoute('/_protected/admin/contacts/')({
  validateSearch: (search: Record<string, unknown>) => {
    const sortBy =
      (search.sortBy as string) === 'created_at'
        ? 'contact_created_at'
        : (search.sortBy as string) || 'contact_created_at';
    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 25,
      sortBy,
      sortDirection: (search.sortDirection as 'asc' | 'desc') || 'desc',
      search: (search.search as string) || '',
      order_type: (search.order_type as string) || undefined,
      event_id: (search.event_id as string) || undefined,
    };
  },
  loaderDeps: ({
    search: { page, pageSize, sortBy, sortDirection, search, order_type, event_id },
  }) => {
    console.log('Loader deps:', {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search,
      order_type,
      event_id,
    });
    return {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search,
      order_type,
      event_id,
    };
  },
  loader: async ({ deps }) => {
    console.log('Loader called with deps:', deps);
    const data = await fetchContactsWithBookings({ data: deps });
    return {
      ...data,
      title: 'Contacts',
    };
  },
  component: ContactsRoute,
});

function ContactsRoute() {
  const loaderData = Route.useLoaderData() as LoaderData;
  const search = Route.useSearch() as SearchParams;
  const navigate = useNavigate();
  const match = Route.useMatch();
  const isLoading = match.status === 'pending';

  const orderTypeFilterOptions = [
    { value: 'HIRE', label: 'Hire' },
    { value: 'EXTENDED_HIRE', label: 'Extended Hire' },
    { value: 'PURCHASE', label: 'Purchase' },
  ];

  const handlePageChange = (page: number) => {
    navigate({
      search: {
        ...search,
        page,
      } as any,
    });
  };

  const handleSortChange = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    navigate({
      search: {
        ...search,
        sortBy,
        sortDirection,
        page: 1,
      } as any,
    });
  };

  const handlePageSizeChange = (pageSize: number) => {
    navigate({
      search: {
        ...search,
        pageSize,
        page: 1,
      } as any,
    });
  };

  const handleSearchChange = (searchValue: string) => {
    navigate({
      search: {
        ...search,
        search: searchValue,
        page: 1,
      } as any,
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: string | null) => {
    navigate({
      search: {
        ...search,
        [filterId]: value,
        page: 1,
      } as any,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md border">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleRowClick = (row: any) => {
    // Navigate to the detail page
    navigate({
      to: `/admin/contacts/${row.contact_id}`,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-2">View and manage all contacts across events</p>
      </div>

      <DataTable
        enableExport={true}
        exportFilename="contacts-export"
        exportTableName="contacts_with_recent_booking"
        exportFields={[
          'contact_id',
          'first_name',
          'surname',
          'email',
          'phone',
          'booking_id',
          'event_id',
          'event_name',
          'order_type',
          'contact_created_at',
        ]}
        columns={columns}
        data={loaderData.data}
        totalCount={loaderData.totalCount}
        page={loaderData.page}
        pageSize={loaderData.pageSize}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        searchValue={search.search}
        defaultSortBy={search.sortBy || 'contact_created_at'}
        defaultSortDirection={search.sortDirection || 'desc'}
        onRowClick={handleRowClick}
        filters={[
          {
            id: 'order_type',
            label: 'Order Type',
            options: orderTypeFilterOptions,
            pluralLabel: 'Order Types',
          },
          {
            id: 'event_id',
            label: 'Event',
            options: [], // We'll fetch events directly in the TableFilters component
            pluralLabel: 'Events',
            useCombobox: true, // Use combo box for events
          },
        ]}
        activeFilters={{
          order_type: search.order_type || null,
          event_id: search.event_id || null,
        }}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
