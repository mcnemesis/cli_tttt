### For Mantainer

This section is meant to manage a clean and well mantained Linux/Debian package for the TEA Interpreter TTTTT.

### Some Instructions:

0. Ensure to work from a proper path with correct permissions to allow package building. 
Note to Self: e.g "/home/nemesisfixx/LAB/package" <--- outside WSL FS for work on Windows!

1. To update the changelog, use `dch` from inside the tttt-x.x.x directory as follows:

    dch -i

3. Make any necessary updates to the tttt-x.x.x/debian/control file (such as updating version, mantainer, etc). Following is an example:


        Package: tttt
        Version: 1.0.2
        Architecture: any
        Maintainer: Joseph W. Lutalo <jwl@nuchwezi.com>
        Depends: python3 (>=3.5)
        Section: devel
        Priority: optional
        Homepage: https://github.com/mcnemesis/cli_tttt
        Description: tttt is the reference implementation of the TEA computer programming language interpreter meant for use in development or running of TEA programs and scripts.
        Source: tttt
        Build-Depends: debhelper (>= 7),python3 (>= 3.5)
        Standards-Version: 1.0.2

2. Ensure to have the necessary package documentation---or rather, the man document (see build script) in correct path and up-to-date.

3. Then build the necessary TTTT Debian source package as such:

    DEB_PACKAGE_DIR/build <---  shall also build the necessary man pages and include them in the deb package
    
    OR
    
    dpkg-deb --build tttt-x.x.x

4. Ensure to update the main package install script. Update the PACKAGE_URI line to point to latest *.deb file

    PACKAGE_URI=https://github.com/mcnemesis/cli_tttt/releases/download/tttt-1.0.1/tttt_1.0.1_amd64.deb

