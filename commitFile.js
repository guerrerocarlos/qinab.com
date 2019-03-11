async function commitBlob(
  octokit,
  branch,
  path,
  content,
  commitMessage,
  button
) {
  if (button) {
    button.disabled = "yeah";
    button.innerHTML = "...";
  }

  //   console.log(
  //     "octokit, branch, path, content, commitMessage",
  //     octokit,
  //     branch,
  //     path,
  //     content,
  //     commitMessage
  //   );
  if (commitMessage.length === 0) {
    commitMessage = "[Empty]";
  }
  try {
    const masterCommit = await octokit.git.getRef({
      owner,
      repo,
      ref: "heads/" + branch
    });
    console.log("masterCommit", masterCommit);
    var headSha = masterCommit.data.object.sha;

    button.innerHTML = "heads/" + branch;

    const headCommit = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: headSha
    });

    button.innerHTML = "head:" + headSha.slice(0, 10);

    const blobInfo = await octokit.git.createBlob({
      owner,
      repo,
      content: content,
      encoding: "utf-8"
    });

    button.innerHTML = "blob:" + blobInfo.data.sha.slice(0, 10);

    console.log("blobInfo", JSON.stringify(blobInfo, null, 2));

    const newTree = [
      {
        path: path,
        mode: "100644",
        type: "blob",
        sha: blobInfo.data.sha
      }
    ];

    const treeResult = await octokit.git.createTree({
      owner,
      repo,
      tree: newTree,
      base_tree: headCommit.data.tree.sha
    });

    button.innerHTML = "tree:" + treeResult.data.sha.slice(0, 10);

    console.log("treeResult", treeResult);

    const commitResult = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: treeResult.data.sha,
      parents: [headSha]
    });

    button.innerHTML = "commit:" + commitResult.data.sha.slice(0, 10);

    delete commitResult["headers"];
    console.log("commitResult", commitResult);

    const updateRefResult = await octokit.git.updateRef({
      owner,
      repo,
      ref: "heads/master",
      sha: commitResult.data.sha
    });

    button.innerHTML = "Committed";
    setTimeout(() => {
      button.innerHTML = "Commit";
    }, 3000);
    button.disabled = "";
    button.disabled = "";
    delete updateRefResult["headers"];
    console.log("updateRefResult", updateRefResult);
  } catch (err) {
    button.innerHTML = "Failed!";
    setTimeout(() => {
      button.innerHTML = "Commit";
    }, 3000);
  }
}
