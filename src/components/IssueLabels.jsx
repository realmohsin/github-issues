import { useState } from "react";
import { GoGear } from "react-icons/go";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { useLabelsData } from "../helpers/useLabelsData";

export default function IssueLabels({ labels, issueNumber }) {
  const labelsQuery = useLabelsData();
  const [menuOpen, setMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  const setLabelsMutation = useMutation(
    (labelId) => {
      const newLabels = labels.includes(labelId)
        ? labels.filter((currentLabel) => currentLabel !== labelId)
        : [...labels, labelId];
      return fetch(`/api/issues/${issueNumber}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ labels: newLabels }),
      }).then((res) => res.json());
    },
    {
      onMutate: (labelId) => {
        const oldLabels = queryClient.getQueryData([
          "issues",
          issueNumber,
        ]).labels;
        const newLabels = oldLabels.includes(labelId)
          ? oldLabels.filter((label) => label !== labelId)
          : [...oldLabels, labelId];

        queryClient.setQueryData(["issues", issueNumber], (data) => ({
          ...data,
          labels: newLabels,
        }));

        return function rollback() {
          queryClient.setQueryData(["issues", issueNumber], (data) => {
            const rollbackLabels = oldLabels.includes(labelId)
              ? [...data.labels, labelId]
              : data.labels.filter((label) => labedId);
            return {
              ...data,
              labels: rollbacklabels,
            };
          });
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
        <span>Labels</span>
        {labelsQuery.isLoading
          ? null
          : labels.map((label) => {
              const labelObject = labelsQuery.data.find(
                (queryLabel) => queryLabel.id === label
              );
              if (!labelObject) return null;
              return (
                <span key={label} className={`label ${labelObject.color}`}>
                  {labelObject.name}
                </span>
              );
            })}
      </div>
      <GoGear
        onClick={() => !labelsQuery.isLoading && setMenuOpen((open) => !open)}
      />
      {menuOpen && (
        <div className="picker-menu labels">
          {labelsQuery.data?.map((label) => {
            const selected = labels.includes(labels.id);
            return (
              <div
                key={label.id}
                className={selected ? "selected" : ""}
                onClick={() => setLabelsMutation.mutate(label.id)}
              >
                <span
                  className="label-dot"
                  style={{ backgroundColor: label.color }}
                ></span>
                {label.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
