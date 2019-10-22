# Release Process

## Creating a new release

The first step when releasing a new version of the WebUI is to make a new release branch from master.
Ensure that your local master branch is in sync with the remote master branch first.

```bash
git pull origin master
git checkout -b bump_version
```

The versions in Raiden WebUI are updated using [bumpversion](https://github.com/peritus/bumpversion).

For the process to work, you should have a working virtual environment with `bumpversion` already installed.

After activating your virtual environment you have to ran the following command:

```bash
bumpversion --current-version 0.7.0 patch
```

This assumes that the current version is `0.7.0` and then next would be a patch version (0.7.1).

Running `bumpversion` will automatically update `setup.py` and `package.json` and creates a bump commit.

Unfortunately due to `bumpversion` matching all of the occurrences of `"version": "(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)";`
and not only the first one, `package-lock.json` is not automatically updated by `bumpversion`.

This means that you have to proceed and update the version in `package-lock.json` manually. Alternatively
you can use `npm install`. Please ensure that the version `package-lock.json` is the same as in `package.json`.

### Updating the Change Log

Before a new release make sure to update [CHANGELOG.md](CHANGELOG.md).
For more information on the change log format please check [keep a changelog](https://keepachangelog.com/en/1.0.0/).

The changes for the version should already be tracked as [Unreleased] so you just should need to replace [Unreleased]
with the new version name.

After finishing with the changes you have to amend the commit that was created by `bumpversion` to
include the manual changes. Then you can create a PR on the repository.

After getting the PR merged on master, you need to tag the release and push the tag to github. Alternatively
you can create the whole release directly through the Github's release interface.

Please be sure to include the changelog for the new release on the Github release page.

The tag creation should trigger an automated release process on CircleCI that should then proceed to
publish the generated artifacts on both GitHub and PyPI.

If for some reason the automated release process fails, you will have to generate the artifacts manually.

## Manually creating the Packages

To build the python package first you have to be sure that you have the tags synchronized
locally. You can synchronize the tags by running `git fetch origin --tags`.
Then you can checkout the tag and start the manual build.

To build the package you have to run:

```bash
python setup.py build sdist bdist_wheel
```

This will create the packages on the `dist/*` folder. After the generation of the package
you have to upload the packages on PyPI using `twine`:

```bash
 twine upload dist/*
```

You have to also upload the packages from the `dist/*` folder to the created release on GitHub.

## Updating the WebUI dependency on raiden

### Locally making and testing binaries

After the package is properly uploaded on PyPI the new package should be tested with the binary distribution.

In order to create a new binary distribution of raiden containing the new WebUI package you have to
go to the directory where you cloned the Raiden repository and modify the `requirements/requirements.txt`, `requirements/requirements-ci.txt` and `requirements/requirements-dev.txt`.

You have to find the webui constraint and updated to the version of the new package.

If your old version is `0.7.1` and your new version is `0.8.0` you have to find the line:

```text
raiden-webui==0.7.1
```

and change it to

```text
raiden-webui==0.8.0
```

Then you have to manually build the binary that will include the new version of the WebUI.
Please make sure you are using the same versions for the following command as in this [config file](https://github.com/raiden-network/raiden/blob/develop/.circleci/config.yml#L42).

```bash
export GETH_URL_LINUX='https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.9.2-e76047e9.tar.gz'
export SOLC_URL_LINUX='https://github.com/ethereum/solidity/releases/download/v0.5.4/solc-static-linux'
export SOLC_VERSION='v0.5.4'
export GETH_VERSION='1.9.2'
make bundle-docker
```

After the completion of the build process you should be able to find a `raiden-master-linux.tar.gz` in the
`build/archive` directory under the raiden repository root folder.

You should use this binary to verify that there are no major issues with the new WebUI version.

### Verification

You should always run some basic checks to ensure that the new version of the WebUI works on Firefox and Chromium based
browsers when using either Geth or Parity for RPC calls.

### Creating a PR on Raiden

If there is no major breaking issue with the updated WebUI, then the next step is to create a PR on
the Raiden repository.

Along with the constraint update you should also add an entry to `docs/changelog.rst` pointing to the tag

```
* :feature:`-` Update WebUI to version 0.7.1 https://github.com/raiden-network/webui/releases/tag/v0.7.1
```
