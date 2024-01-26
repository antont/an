from atproto import IdResolver  # for async use AsyncIdResolver

resolver = IdResolver()
did = resolver.handle.resolve('an.org')
assert did is not None
did_doc = resolver.did.resolve(did)

print(did)
print(did_doc)