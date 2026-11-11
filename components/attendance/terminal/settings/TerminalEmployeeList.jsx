import EmployeePhoto from "@/components/EmployeePhoto";
import { Button, Form, Panel, Table } from "@/components/WorkspaceUI";

const statusLabels = {
  ready: "Ready",
  photo_required: "Add a photo",
  account_inactive: "Account inactive",
  not_enabled: "Not enabled",
  expired: "Permission expired",
  photo_changed: "Photo changed — enable again",
};

export default function TerminalEmployeeList({
  settings,
  loading,
  page,
  onRefresh,
  onSearch,
  onManagePhoto,
  onPageChange,
}) {
  return (
    <Panel
      title="Employee photos"
      action={
        <Button secondary disabled={loading} onClick={onRefresh}>
          Refresh
        </Button>
      }
    >
      <Form
        fields={[{ name: "search", label: "Find employee", optional: true }]}
        submitLabel="Search"
        successMessage=""
        onSubmit={onSearch}
      />
      <div className="mt-5">
        {loading ? (
          <p role="status" className="text-sm text-zinc-400">
            Loading employees…
          </p>
        ) : (
          settings && (
            <>
              <Table
                rows={settings.employees}
                columns={[
                  {
                    key: "name",
                    label: "Employee",
                    render: (employee) => (
                      <div className="flex items-center gap-3">
                        <EmployeePhoto employee={employee} compact />
                        <div>
                          <p>{employee.name}</p>
                          <p className="text-xs text-zinc-400">
                            {employee.code}
                          </p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "faceAttendance",
                    label: "Face attendance",
                    render: (employee) =>
                      statusLabels[employee.faceAttendance?.state] ||
                      "Not enabled",
                  },
                  {
                    key: "actions",
                    label: "Action",
                    render: (employee) => (
                      <Button secondary onClick={() => onManagePhoto(employee)}>
                        Manage photo
                      </Button>
                    ),
                  },
                ]}
              />
              {settings.pages > 1 && (
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    secondary
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-zinc-400">
                    Page {page} of {settings.pages}
                  </span>
                  <Button
                    secondary
                    disabled={page >= settings.pages}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </Panel>
  );
}
