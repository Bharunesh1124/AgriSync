const fs = require('fs');

let content = fs.readFileSync('app/(drawer)/reports.tsx', 'utf-8');

// The file ends at </Modal>\n\n\n\n\n} or similar because content[-1] was appended.
// Let's strip anything after </Modal> and append the correct footer.

const modalIdx = content.lastIndexOf('</Modal>');
if (modalIdx !== -1) {
    content = content.substring(0, modalIdx + 8);
    const footer = \
      </SafeAreaView>
    );
}

import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  }
});
\;
    content += footer;
    fs.writeFileSync('app/(drawer)/reports.tsx', content, 'utf-8');
    console.log('Fixed EOF');
} else {
    console.log('Could not find </Modal>');
}
