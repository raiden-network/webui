#!/usr/bin/env python
import distutils.log
import os
import subprocess
from distutils.spawn import find_executable

from setuptools import Command, find_packages, setup
from distutils.command.build import build


class BuildCommand(build):

    def run(self):
        self.run_command('compile_webui')
        build.run(self)


class CompileWebUI(Command):
    description = 'use npm to compile raiden_webui'
    user_options = [
        ('dev', 'D', 'use development preset, instead of production (default)'),
    ]

    def initialize_options(self):
        self.dev = None

    def finalize_options(self):
        pass

    def run(self):
        npm = find_executable('npm')
        if not npm:
            if os.environ.get('RAIDEN_NPM_MISSING_FATAL') is not None:
                # Used in the automatic deployment scripts to prevent builds with missing web-ui
                raise RuntimeError('NPM not found. Aborting')
            self.announce(
                'NPM not found. Skipping webUI compilation',
                level=distutils.log.WARN,  # pylint: disable=no-member
            )
            return
        npm_run = 'build:prod'
        if self.dev is not None:
            npm_run = 'build:dev'

        cwd = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__)
            ),
        )

        npm_version = subprocess.check_output([npm, '--version'])
        # require npm 4.x.x or later
        if not int(npm_version.split(b'.')[0]) >= 4:
            if os.environ.get('RAIDEN_NPM_MISSING_FATAL') is not None:
                # Used in the automatic deployment scripts to prevent builds with missing web-ui
                raise RuntimeError(f'NPM >= 4.0 required. Have {npm_version} from {npm}.')
            self.announce(
                'NPM 4.x or later required. Skipping webUI compilation',
                level=distutils.log.WARN,  # pylint: disable=no-member
            )
            return

        command = [npm, 'install']
        self.announce(
            'Running %r in %r' % (command, cwd),
            level=distutils.log.INFO,  # pylint: disable=no-member
        )
        subprocess.check_call(command, cwd=cwd)

        command = [npm, 'run', npm_run]
        self.announce(
            'Running %r in %r' % (command, cwd),
            level=distutils.log.INFO,  # pylint: disable=no-member
        )
        subprocess.check_call(command, cwd=cwd)

        self.announce(
            'WebUI compiled with success!',
            level=distutils.log.INFO,  # pylint: disable=no-member
        )


with open('README.md', encoding='utf-8') as readme_file:
    readme = readme_file.read()

history = ''

version = '0.6.0'  # Do not edit: this is maintained by bumpversion (see .bumpversion.cfg)

setup(
    name='raiden-webui',
    description='Raiden webui',
    version=version,
    long_description=readme,
    long_description_content_type='text/markdown',
    author='Brainbot Labs Est.',
    author_email='contact@brainbot.li',
    url='https://github.com/raiden-network/webui',
    packages=find_packages(),
    include_package_data=True,
    license='MIT',
    zip_safe=False,
    keywords='raiden webui',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Natural Language :: English'
    ],
    cmdclass={
        'compile_webui': CompileWebUI,
        'build': BuildCommand
    },
    use_scm_version=True,
    setup_requires=['setuptools_scm'],
    python_requires='>=3.6'
)
