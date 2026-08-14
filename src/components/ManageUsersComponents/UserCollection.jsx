import UserRow from "./UserRow";
import UserCard from "./UserCard";

export default function UserCollection({ users, viewMode = "list", ...userProps }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} {...userProps} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {users.map((user) => (
        <UserRow key={user.id} user={user} {...userProps} />
      ))}
    </div>
  );
}
