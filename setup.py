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
    description = 'use yarn to compile raiden_webui'
    user_options = [
        ('dev', 'D', 'use development preset, instead of production (default)'),
    ]

    def initialize_options(self):
        self.dev = None

    def finalize_options(self):
        pass

    def run(self):
        yarn = find_executable('yarn')
        if not yarn:
            self.announce(
                'Yarn not found. Skipping webUI compilation',
                level=distutils.log.WARN,  # pylint: disable=no-member
            )
            return

        yarn_run = 'build:prod'
        if self.dev is not None:
            yarn_run = 'build:dev'

        cwd = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__)
            ),
        )

        yarn_version = subprocess.check_output([yarn, '--version'])
        # require yarn 1.x.x
        if not int(yarn_version.split(b'.')[0]) == 1:
            raise RuntimeError(f'Yarn v1 required. Have {yarn_version} from {yarn}.')

        command = [yarn, 'install', '--frozen-lockfile']
        self.announce(
            'Running %r in %r' % (command, cwd),
            level=distutils.log.INFO,  # pylint: disable=no-member
        )
        subprocess.check_call(command, cwd=cwd)

        command = [yarn, 'run', yarn_run]
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

version = '1.2.1'  # Do not edit: this is maintained by bumpversion (see .bumpversion.cfg)

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
