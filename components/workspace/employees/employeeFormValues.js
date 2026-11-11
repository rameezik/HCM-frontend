export default function employeeFormValues(employee) {
  return Object.fromEntries(
    [
      "name",
      "email",
      "code",
      "department",
      "designation",
      "joinDate",
      "exitDate",
      "status",
      "gender",
      "basic",
      "phone",
      "address",
    ].flatMap((key) =>
      employee[key] === undefined
        ? []
        : [
            [
              key,
              ["department", "designation"].includes(key)
                ? employee[key]?._id || employee[key]
                : employee[key],
            ],
          ],
    ),
  );
}
