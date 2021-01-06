# Release Guidelines

Releases for the Platformer CLI are handled through the Github Action `workflows/release-workflow.yml`.

# Create a new release

1. Commit any pending changes

   > `git add . && git commit -m "COMMIT_MESSAGE"`

1. Update the version with yarn
   > `yarn version`

(Yarn version will trigger the pre-version hooks that will run tests and linters before creating the tag. **Note that this automatically creates a new tag - it does not need to be added manually**)

1. Push the new tag

   > `git push --tags`
   >
   > - This will trigger the release pipeline and create a new Github release (as a draft).

1. Finalize the (Github) Release Draft. (Under Releases > Edit Release > update the details and publish the release).
