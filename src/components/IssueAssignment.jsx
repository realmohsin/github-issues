import { useUserData } from "../helpers/useUserData";
import { GoGear } from "react-icons/go";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { useState } from "react";

export default function IssueAssignment({ assignee, issueNumber }) {
  const assigneeQuery = useUserData(assignee);

  const [menuOpen, setMenuOpen] = useState(false);

  const usersQuery = useQuery(["users"], () =>
    fetch("/api/users").then((res) => res.json())
  );

  const queryClient = useQueryClient();

  const setAssignmentMutation = useMutation(
    (assignee) => {
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ assignee }),
      }).then((res) => res.json());
    },
    {
      onMutate: (assignee) => {
        const oldAssignee = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).assignee;
        queryClient.setQueryData(["issues", issueNumber], (data) => ({
          ...data,
          assignee,
        }));
        return function rollback() {
          queryClient.setQueryData(["issues", issueNumber], (data) => ({
            ...data,
            assignee: oldAssignee,
          }));
        };
      },
      onError: (error, variables, rollback) => {
        rollback();
      },
      onSettled: () => {
        queryClient.invalidateQueries(["issues", issueNumber], { exact: true });
      },
    }
  );

  return (
    <div className="issue-options">
      <div>
        <span>Assignment</span>
        {assigneeQuery.isSuccess && (
          <div>
            <img src={assigneeQuery.data.profilePictureUrl} />
            {assigneeQuery.data.name}
          </div>
        )}
      </div>
      <GoGear
        onClick={() => !usersQuery.isLoading && setMenuOpen((open) => !open)}
      />
      {menuOpen && (
        <div className="picker-menu">
          {usersQuery.data?.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                setAssignmentMutation.mutate(user.id);
              }}
            >
              <img src={user.profilePictureUrl} />
              {user.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
