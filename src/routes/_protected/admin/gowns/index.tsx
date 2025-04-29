import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DataTable } from '@/components/admin/data-table'
import { columns } from '@/components/admin/gowns/columns'
import { fetchGownsWithLatestBooking } from '@/utils/all-gowns'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchParams {
    page: number
    pageSize: number
    sortBy: string
    sortDirection: 'asc' | 'desc'
    search: string
}

interface LoaderData {
    data: any[]
    totalCount: number
    page: number
    pageSize: number
    title: string
}

export const Route = createFileRoute('/_protected/admin/gowns/')({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            page: Number(search.page) || 1,
            pageSize: Number(search.pageSize) || 25,
            sortBy: (search.sortBy as string) || 'check_out_time',
            sortDirection: (search.sortDirection as 'asc' | 'desc') || 'desc',
            search: (search.search as string) || ''
        }
    },
    loaderDeps: ({ search: { page, pageSize, sortBy, sortDirection, search } }) => {
        console.log('Loader deps:', { page, pageSize, sortBy, sortDirection, search })
        return {
            page,
            pageSize,
            sortBy,
            sortDirection,
            search
        }
    },
    loader: async ({ deps }) => {
        console.log('Loader called with deps:', deps)
        const data = await fetchGownsWithLatestBooking({ data: deps })
        return {
            ...data,
            title: 'Gowns'
        }
    },
    component: GownsRoute
})

function GownsRoute() {
    const loaderData = Route.useLoaderData() as LoaderData
    const search = Route.useSearch() as SearchParams
    const navigate = useNavigate()
    const match = Route.useMatch()
    const isLoading = match.status === 'pending'

    const handlePageChange = (page: number) => {
        navigate({
            search: {
                ...search,
                page
            } as any
        })
    }

    const handleSortChange = (sortBy: string, sortDirection: 'asc' | 'desc') => {
        navigate({
            search: {
                ...search,
                sortBy,
                sortDirection,
                page: 1
            } as any
        })
    }

    const handlePageSizeChange = (pageSize: number) => {
        navigate({
            search: {
                ...search,
                pageSize,
                page: 1
            } as any
        })
    }

    const handleSearchChange = (searchValue: string) => {
        navigate({
            search: {
                ...search,
                search: searchValue,
                page: 1
            } as any
        })
    }

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
        )
    }

    return (
        <div className="container mx-auto py-10">
            <DataTable
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
                defaultSortBy="check_out_time"
                defaultSortDirection="desc"
            />
        </div>
    )
}
