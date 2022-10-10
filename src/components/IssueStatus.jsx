import { useQueryClient, useMutation } from "react-query";
import { StatusSelect } from "./StatusSelect";

export default function IssueStatus({ status, issueNumber }) {
  const queryClient = useQueryClient();
  const setStatusMutation = useMutation(
    (status) => {
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      }).then((res) => res.json());
    },
    {
      onMutate: (status) => {
        const oldStatus = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).status;
        queryClient.setQueryData(["issues", issueNumber], (data) => ({
          ...data,
          status,
        }));
        return function rollback() {
          queryClient.setQueryData(["issues", issueNumber], (data) => ({
            ...data,
            status: oldStatus,
          }));
        };
      },
      onError: (error, variables, rollback) => {
        rollback();
      },
      // if response includes data we can use to update, we can manually update
      // the cache again with this data. However, in this particular cause, user
      // can update multiple times in a row, so what ends up happening is a
      // jarring experience due to the optimistic update (from onMutate) happening
      // while previous update's onSuccess update coming in and rewriting the new
      // optimistic update. So in this particular case we'll just assume the
      // optimistic update in onMutate was correct
      //   onSuccess: (data, variables, rollback) => {
      //     rollback()
      //     queryClient.setQueryData(['issues', issueNumber], data)
      //   },
      onSettled: () => {
        queryClient.invalidateQueries(["issues", issueNumber], { exact: true });
      },
    }
  );
  return (
    <div className="issue-options">
      <div>
        <span>Status</span>
        <StatusSelect
          noEmptyOption
          value={status}
          onChange={(e) => {
            setStatusMutation.mutate(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
